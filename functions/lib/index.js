"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processAthleteOnWrite = exports.triggerTeamUnifySync = void 0;
const functions = require("firebase-functions/v2");
const admin = require("firebase-admin");
const google_auth_library_1 = require("google-auth-library");
admin.initializeApp();
exports.triggerTeamUnifySync = functions.firestore.onDocumentCreated('sync_requests/{docId}', async (event) => {
    const snapshot = event.data;
    if (!snapshot)
        return;
    const db = admin.firestore();
    const syncLockRef = db.collection('settings').doc('syncLock');
    try {
        let shouldSync = false;
        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(syncLockRef);
            const now = new Date();
            // Use Pacific time to determine the current "day" for the team
            const todayString = now.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' });
            if (doc.exists) {
                const data = doc.data();
                if (data?.lastSyncDate === todayString) {
                    // Already synced today, update the request document and abort
                    transaction.update(snapshot.ref, { status: 'failed', error: 'TeamUnify sync has already been run today.' });
                    return;
                }
            }
            shouldSync = true;
            transaction.set(syncLockRef, {
                lastSyncDate: todayString,
                lastSyncTimestamp: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });
        if (!shouldSync)
            return;
        // Update status to processing
        await snapshot.ref.update({ status: 'processing' });
        const targetUrl = 'https://teamunify-sync-448467347068.us-central1.run.app/sync';
        const auth = new google_auth_library_1.GoogleAuth();
        const client = await auth.getIdTokenClient(targetUrl);
        // Attempt the POST request
        const res = await client.request({ url: targetUrl, method: 'POST' });
        // Update status to success
        await snapshot.ref.update({ status: 'success', statusCode: res.status });
    }
    catch (error) {
        console.error('Sync Error:', error);
        await snapshot.ref.update({ status: 'failed', error: error.message || 'An error occurred during sync.' });
    }
});
function mapGroup(rawGroup) {
    if (!rawGroup)
        return 'Splash';
    const lowerGroup = rawGroup.toLowerCase();
    if (lowerGroup.includes('senior'))
        return 'Seniors';
    if (lowerGroup.includes('age group'))
        return 'Age Groupers';
    if (lowerGroup.includes('little'))
        return 'Littles';
    if (lowerGroup.includes('pre'))
        return 'Pre-Team';
    if (lowerGroup.includes('splash'))
        return 'Splash';
    if (lowerGroup.includes('rec'))
        return 'Rec Team';
    if (lowerGroup.includes('master'))
        return 'Masters';
    return 'Splash'; // Default fallback
}
exports.processAthleteOnWrite = functions.firestore.onDocumentWritten('athletes/{athleteId}', async (event) => {
    const snapshot = event.data;
    if (!snapshot)
        return;
    const after = snapshot.after.data();
    if (!after)
        return; // Document was deleted
    // Extract raw fields that the sync script might push
    const roster = after.roster || '';
    const billingGroup = after.billingGroup || '';
    // If there are no raw fields, skip processing to avoid infinite loops
    if (after.roster === undefined && after.billingGroup === undefined) {
        return;
    }
    // Combine both strings to maximize chances of finding the group keyword
    const combinedString = `${roster} ${billingGroup}`;
    const mappedGroup = mapGroup(combinedString);
    // Set the mapped group and remove the raw fields
    const updateData = {
        group: mappedGroup
    };
    if (after.roster !== undefined) {
        updateData.roster = admin.firestore.FieldValue.delete();
    }
    if (after.billingGroup !== undefined) {
        updateData.billingGroup = admin.firestore.FieldValue.delete();
    }
    return snapshot.after.ref.update(updateData);
});
//# sourceMappingURL=index.js.map