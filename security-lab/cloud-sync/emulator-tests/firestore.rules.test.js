import { readFileSync } from "node:fs";
import { before, beforeEach, after, test } from "node:test";
import assert from "node:assert/strict";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc
} from "firebase/firestore";

const projectId = "demo-deyn-sync";
const shopId = "shop-alpha";
const deviceId = "A".repeat(32);
const now = Date.now();
let testEnv;

const path = (suffix) => `shops/${shopId}/${suffix}`;
const customerPath = (id = "customer-1") => path(`customers/${id}`);
const ledgerPath = (id = "event-1") => path(`ledger/${id}`);
const deviceDocId = (uid) => `${deviceId}__${uid}`;

function authDb(uid, role = "worker", shop = shopId, device = deviceId) {
  return testEnv.authenticatedContext(uid, {
    shopId: shop,
    memberRole: role,
    deviceId: device
  }).firestore();
}

async function seed({ expiresAt = now + 60 * 60 * 1000 } = {}) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, `shops/${shopId}`), {
      shopId,
      ownerUid: "owner-1",
      status: "active",
      subscriptionExpiresAtMs: expiresAt,
      schemaVersion: 1
    });
    await setDoc(doc(db, path("members/owner-1")), {
      uid: "owner-1", shopId, role: "owner", status: "active"
    });
    await setDoc(doc(db, path("members/worker-1")), {
      uid: "worker-1", shopId, role: "worker", status: "active"
    });
    for (const [uid, role] of [["owner-1", "owner"], ["worker-1", "worker"]]) {
      await setDoc(doc(db, path(`devices/${deviceDocId(uid)}`)), {
        deviceId, uid, shopId, role, status: "active"
      });
    }
    await setDoc(doc(db, customerPath()), {
      id: "customer-1",
      shopId,
      name: "Test customer",
      revision: 1,
      archivedAt: null
    });
  });
}

before(async () => {
  const rules = readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { rules }
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await seed();
});

after(async () => {
  await testEnv?.cleanup();
});

test("worker can read customers and create a customer", async () => {
  const db = authDb("worker-1");
  await assertSucceeds(getDoc(doc(db, customerPath())));
  await assertSucceeds(setDoc(doc(db, customerPath("customer-2")), {
    id: "customer-2", shopId, name: "New customer", revision: 1, archivedAt: null
  }));
});

test("worker can append a debt or payment event", async () => {
  const db = authDb("worker-1");
  await assertSucceeds(setDoc(doc(db, ledgerPath()), {
    eventId: "event-1",
    shopId,
    customerId: "customer-1",
    kind: "debt",
    amountDzd: 1500,
    createdAtMs: now,
    deviceId,
    actorUid: "worker-1"
  }));
});

test("worker cannot edit or delete customer profiles", async () => {
  const db = authDb("worker-1");
  await assertFails(updateDoc(doc(db, customerPath()), {
    name: "Tampered name",
    revision: 2
  }));
  await assertFails(deleteDoc(doc(db, customerPath())));
});

test("ledger events are append-only for workers and owners", async () => {
  const ownerDb = authDb("owner-1", "owner");
  await assertSucceeds(setDoc(doc(ownerDb, ledgerPath()), {
    eventId: "event-1",
    shopId,
    customerId: "customer-1",
    kind: "payment",
    amountDzd: 500,
    createdAtMs: now,
    deviceId,
    actorUid: "owner-1"
  }));
  await assertFails(updateDoc(doc(ownerDb, ledgerPath()), { amountDzd: 1 }));
  await assertFails(deleteDoc(doc(ownerDb, ledgerPath())));
});

test("owner can revise a customer profile with the next revision", async () => {
  const db = authDb("owner-1", "owner");
  await assertSucceeds(updateDoc(doc(db, customerPath()), {
    name: "Corrected name",
    revision: 2
  }));
});

test("owner cannot skip a profile revision", async () => {
  const db = authDb("owner-1", "owner");
  await assertFails(updateDoc(doc(db, customerPath()), {
    name: "Skipped revision",
    revision: 3
  }));
});

test("cross-shop access is denied", async () => {
  const db = authDb("worker-1", "worker", "shop-beta");
  await assertFails(getDoc(doc(db, "shops/shop-beta/customers/customer-1")));
});

test("forged owner role on a worker account is denied", async () => {
  const db = authDb("worker-1", "owner");
  await assertFails(getDoc(doc(db, customerPath())));
});

test("unauthenticated reads are denied", async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  await assertFails(getDocs(collection(db, path("customers"))));
});

test("expired shop subscription blocks access", async () => {
  await testEnv.clearFirestore();
  await seed({ expiresAt: now - 1 });
  const db = authDb("worker-1");
  await assertFails(getDoc(doc(db, customerPath())));
});

test("ledger writes require an existing customer and positive integer amount", async () => {
  const db = authDb("worker-1");
  await assertFails(setDoc(doc(db, ledgerPath("missing-customer-event")), {
    eventId: "missing-customer-event",
    shopId,
    customerId: "does-not-exist",
    kind: "debt",
    amountDzd: 100,
    createdAtMs: now,
    deviceId,
    actorUid: "worker-1"
  }));
  await assertFails(setDoc(doc(db, ledgerPath("bad-amount-event")), {
    eventId: "bad-amount-event",
    shopId,
    customerId: "customer-1",
    kind: "debt",
    amountDzd: -5,
    createdAtMs: now,
    deviceId,
    actorUid: "worker-1"
  }));
});
