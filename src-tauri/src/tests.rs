use crate::{config, db, models::*, sync};
use rusqlite::Connection;
use serde_json::json;

fn database() -> Connection {
    let mut conn = Connection::open_in_memory().unwrap();
    db::initialize(&mut conn).unwrap();
    conn
}

fn input(quantity: i64) -> ComponentInput {
    ComponentInput {
        name: "电阻".into(),
        category: "电阻".into(),
        package: "0603".into(),
        value: "10k".into(),
        quantity,
        min_quantity: Some(10),
        location: "A1".into(),
        notes: String::new(),
        unit_price: Some(0.01),
    }
}

fn component(conn: &mut Connection, quantity: i64) -> Component {
    db::save_component(conn, None, input(quantity)).unwrap();
    db::components(conn, false).unwrap().pop().unwrap()
}

fn movement(id: &str, quantity: i64, kind: &str) -> MovementInput {
    MovementInput {
        component_id: id.into(),
        quantity,
        kind: kind.into(),
        note: "测试".into(),
    }
}

#[test]
fn initialization_is_repeatable_and_does_not_reset_inventory() {
    let mut conn = database();
    let c = component(&mut conn, 30);
    db::initialize(&mut conn).unwrap();
    assert_eq!(
        db::get_component(&conn, &c.id).unwrap().unwrap().quantity,
        30
    );
    conn.pragma_update(None, "user_version", 99).unwrap();
    assert!(db::initialize(&mut conn).is_err());
}

#[test]
fn stock_and_movement_commit_together_and_reject_overdraw() {
    let mut conn = database();
    let c = component(&mut conn, 30);
    db::create_movement(&mut conn, movement(&c.id, 12, "out")).unwrap();
    assert_eq!(
        db::get_component(&conn, &c.id).unwrap().unwrap().quantity,
        18
    );
    assert!(db::create_movement(&mut conn, movement(&c.id, 19, "out")).is_err());
    assert_eq!(
        db::get_component(&conn, &c.id).unwrap().unwrap().quantity,
        18
    );
    assert_eq!(db::movements(&conn, false).unwrap().len(), 1);
    // Inject a write failure after the quantity update; the whole operation must roll back.
    conn.execute_batch("CREATE TRIGGER reject_movement BEFORE INSERT ON stock_movements BEGIN SELECT RAISE(ABORT,'test'); END;").unwrap();
    assert!(db::create_movement(&mut conn, movement(&c.id, 2, "in")).is_err());
    assert_eq!(
        db::get_component(&conn, &c.id).unwrap().unwrap().quantity,
        18
    );
}

#[test]
fn timestamps_are_monotonic_and_legacy_dates_are_utc() {
    assert_eq!(
        db::timestamp("2026-09-22 08:00:00").unwrap(),
        db::timestamp("2026-09-22T08:00:00.000Z").unwrap()
    );
    let future = "2099-01-01T00:00:00.999Z";
    assert!(
        db::timestamp(&db::next_timestamp(Some(future)).unwrap()).unwrap()
            > db::timestamp(future).unwrap()
    );
    assert!(db::timestamp("bad").is_err());
}

#[test]
fn deletion_is_synced_as_a_tombstone_and_hides_movements() {
    let mut conn = database();
    let c = component(&mut conn, 30);
    db::create_movement(&mut conn, movement(&c.id, 2, "in")).unwrap();
    db::delete_component(&mut conn, &c.id).unwrap();
    assert!(db::snapshot(&conn).unwrap().components.is_empty());
    assert!(db::snapshot(&conn).unwrap().movements.is_empty());
    assert!(db::components(&conn, true).unwrap()[0].deleted_at.is_some());
    assert_eq!(db::movements(&conn, true).unwrap().len(), 1);
    assert!(db::create_movement(&mut conn, movement(&c.id, 1, "in")).is_err());
}

#[test]
fn pull_preserves_unsent_local_edits_and_deletions() {
    let mut conn = database();
    let c = component(&mut conn, 30);
    let mut remote = c.clone();
    remote.quantity = 999;
    remote.updated_at = "2099-01-01T00:00:00.000Z".into();
    let report = db::apply_pull(&mut conn, &[remote.clone()], &[]).unwrap();
    assert_eq!(report.preserved, 1);
    assert_eq!(
        db::get_component(&conn, &c.id).unwrap().unwrap().quantity,
        30
    );
    db::delete_component(&mut conn, &c.id).unwrap();
    db::apply_pull(&mut conn, &[remote], &[]).unwrap();
    assert!(db::get_component(&conn, &c.id)
        .unwrap()
        .unwrap()
        .deleted_at
        .is_some());
}

#[test]
fn pull_uses_newer_versions_and_never_replays_stock_changes() {
    let mut remote = database();
    let c = component(&mut remote, 30);
    db::create_movement(&mut remote, movement(&c.id, 5, "out")).unwrap();
    let all = db::components(&remote, true).unwrap();
    let moves = db::movements(&remote, true).unwrap();
    let mut local = database();
    let first = db::apply_pull(&mut local, &all, &moves).unwrap();
    assert_eq!((first.components, first.movements), (1, 1));
    let second = db::apply_pull(&mut local, &all, &moves).unwrap();
    assert_eq!((second.components, second.movements), (0, 0));
    assert_eq!(
        db::get_component(&local, &c.id).unwrap().unwrap().quantity,
        25
    );
    assert_eq!(db::snapshot(&local).unwrap().pending, 0);
    // Older snapshots cannot resurrect an already pulled deletion.
    db::delete_component(&mut remote, &c.id).unwrap();
    db::apply_pull(&mut local, &db::components(&remote, true).unwrap(), &moves).unwrap();
    db::apply_pull(&mut local, &all, &moves).unwrap();
    assert!(db::components(&local, false).unwrap().is_empty());
}

#[test]
fn failed_pull_rolls_back_all_rows() {
    let mut remote = database();
    let c = component(&mut remote, 30);
    let m = Movement {
        id: "m1".into(),
        component_id: "missing".into(),
        kind: "in".into(),
        quantity: 5,
        note: String::new(),
        created_at: c.created_at.clone(),
        component_name: String::new(),
    };
    let mut local = database();
    assert!(db::apply_pull(&mut local, &[c], &[m]).is_err());
    assert!(db::components(&local, false).unwrap().is_empty());
}

#[test]
fn push_acknowledgement_preserves_edits_made_during_network_request() {
    let mut conn = database();
    let c = component(&mut conn, 30);
    db::create_movement(&mut conn, movement(&c.id, 2, "in")).unwrap();
    assert_eq!(
        db::acknowledge_push(&mut conn, &[c.clone()], &[c], &[]).unwrap(),
        1
    );
    let current = db::components(&conn, true).unwrap();
    assert_eq!(current[0].quantity, 32);
    let moves = db::movements(&conn, true).unwrap();
    db::acknowledge_push(&mut conn, &current, &current, &moves).unwrap();
    assert_eq!(db::snapshot(&conn).unwrap().pending, 0);
}

#[test]
fn incomplete_push_ack_does_not_clear_pending_changes() {
    let mut conn = database();
    let c = component(&mut conn, 30);
    assert!(db::acknowledge_push(&mut conn, &[c], &[], &[]).is_err());
    assert_eq!(db::snapshot(&conn).unwrap().pending, 1);
}

#[test]
fn newer_cloud_record_wins_when_push_is_acknowledged() {
    let mut conn = database();
    let c = component(&mut conn, 30);
    let mut remote = c.clone();
    remote.updated_at = "2099-01-01T00:00:00.000Z".into();
    remote.quantity = 21;
    db::acknowledge_push(&mut conn, &[c.clone()], &[remote], &[]).unwrap();
    assert_eq!(
        db::get_component(&conn, &c.id).unwrap().unwrap().quantity,
        21
    );
    assert_eq!(db::snapshot(&conn).unwrap().pending, 0);
}

#[test]
fn d1_partial_failures_and_incomplete_responses_are_not_success() {
    assert!(sync::parse_response(
        true,
        json!({"success":true,"result":[{"success":true},{"success":false}]}),
        2
    )
    .is_err());
    assert!(sync::parse_response(true, json!({"success":true,"result":[]}), 1).is_err());
    assert!(sync::parse_response(
        false,
        json!({"success":true,"result":[{"success":true}]}),
        1
    )
    .is_err());
    assert!(
        sync::parse_response(true, json!({"success":true,"result":[{"success":true}]}), 1).is_ok()
    );
}

#[test]
fn remote_upsert_compares_old_and_new_date_formats() {
    let mut conn = database();
    let mut c = component(&mut conn, 30);
    conn.execute("UPDATE components SET updated_at='2026-09-22 08:00:00'", [])
        .unwrap();
    c.updated_at = "2026-09-22T07:59:59.999Z".into();
    let sql = format!(
        "{} WHERE julianday(excluded.updated_at)>=julianday(components.updated_at)",
        db::UPSERT_COMPONENT
    );
    let params = rusqlite::params![
        c.id,
        c.name,
        c.category,
        c.package,
        c.value,
        99,
        c.min_quantity,
        c.location,
        c.notes,
        c.unit_price,
        c.created_at,
        c.updated_at,
        c.deleted_at
    ];
    assert_eq!(conn.execute(&sql, params).unwrap(), 0);
    assert_eq!(
        db::get_component(&conn, &c.id).unwrap().unwrap().quantity,
        30
    );
}

#[test]
#[cfg(windows)]
fn config_round_trip_encrypts_token_and_target_switch_marks_all_dirty() {
    let mut conn = database();
    let c = component(&mut conn, 30);
    db::acknowledge_push(&mut conn, &[c.clone()], &[c], &[]).unwrap();
    let input = config::ConfigInput {
        account_id: "a".repeat(32),
        database_id: "00000000-0000-4000-8000-000000000001".into(),
        api_token: "test-only-token".into(),
    };
    config::save(&mut conn, input).unwrap();
    assert_eq!(config::load(&conn).unwrap().api_token, "test-only-token");
    let raw: Vec<u8> = conn
        .query_row(
            "SELECT value FROM local_settings WHERE key='api_token'",
            [],
            |r| r.get(0),
        )
        .unwrap();
    assert!(!raw.windows(15).any(|w| w == b"test-only-token"));
    let visible = serde_json::to_string(&config::view(&conn).unwrap()).unwrap();
    assert!(!visible.contains("test-only-token"));
    assert_eq!(db::snapshot(&conn).unwrap().pending, 1);
    config::save(
        &mut conn,
        config::ConfigInput {
            account_id: "a".repeat(32),
            database_id: "00000000-0000-4000-8000-000000000001".into(),
            api_token: String::new(),
        },
    )
    .unwrap();
    assert_eq!(config::load(&conn).unwrap().api_token, "test-only-token");
}
