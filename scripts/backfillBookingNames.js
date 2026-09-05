"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
var app_1 = require("firebase/app");
var firestore_1 = require("firebase/firestore");
var firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};
// Initialize Firebase
// Initialize Firebase
var app = (0, app_1.initializeApp)(firebaseConfig);
var db = (0, firestore_1.getFirestore)(app);
function backfillBookingNames() {
    return __awaiter(this, void 0, void 0, function () {
        var bookingsRef, q, querySnapshot, updatedCount, _i, _a, bookingDoc, bookingData, bookingId, currentCustomerName, touristId, userDocSnapshot, userData, userName, bookingRef, userFetchError_1, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('[BACKFILL] Starting backfill script for booking customer names...');
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 16, , 17]);
                    bookingsRef = (0, firestore_1.collection)(db, 'bookings');
                    q = (0, firestore_1.query)(bookingsRef);
                    return [4 /*yield*/, (0, firestore_1.getDocs)(q)];
                case 2:
                    querySnapshot = _b.sent();
                    console.log("[BACKFILL] Found ".concat(querySnapshot.size, " total bookings."));
                    updatedCount = 0;
                    _i = 0, _a = querySnapshot.docs;
                    _b.label = 3;
                case 3:
                    if (!(_i < _a.length)) return [3 /*break*/, 15];
                    bookingDoc = _a[_i];
                    bookingData = bookingDoc.data();
                    bookingId = bookingDoc.id;
                    currentCustomerName = bookingData.customerName;
                    if (!(!currentCustomerName || typeof currentCustomerName !== 'string' || currentCustomerName.trim() === '')) return [3 /*break*/, 14];
                    touristId = bookingData.touristId;
                    console.log("[BACKFILL] Processing booking ".concat(bookingId, ": customerName is missing or empty. TouristId: ").concat(touristId || 'N/A'));
                    if (!touristId) return [3 /*break*/, 13];
                    _b.label = 4;
                case 4:
                    _b.trys.push([4, 11, , 12]);
                    return [4 /*yield*/, (0, firestore_1.getDoc)((0, firestore_1.doc)(db, 'users', touristId))];
                case 5:
                    userDocSnapshot = _b.sent();
                    if (!userDocSnapshot.exists()) return [3 /*break*/, 9];
                    userData = userDocSnapshot.data();
                    userName = userData.name;
                    if (!(userName && typeof userName === 'string')) return [3 /*break*/, 7];
                    bookingRef = (0, firestore_1.doc)(db, 'bookings', bookingId);
                    return [4 /*yield*/, (0, firestore_1.updateDoc)(bookingRef, {
                            customerName: userName
                        })];
                case 6:
                    _b.sent();
                    console.log("[BACKFILL] Successfully updated booking ".concat(bookingId, " with customerName: ").concat(userName));
                    updatedCount++;
                    return [3 /*break*/, 8];
                case 7:
                    console.warn("[BACKFILL] User document for touristId ".concat(touristId, " found, but 'name' field is missing or invalid. Booking ").concat(bookingId, "."));
                    _b.label = 8;
                case 8: return [3 /*break*/, 10];
                case 9:
                    console.warn("[BACKFILL] User document not found for touristId: ".concat(touristId, " for booking ").concat(bookingId, "."));
                    _b.label = 10;
                case 10: return [3 /*break*/, 12];
                case 11:
                    userFetchError_1 = _b.sent();
                    console.error("[BACKFILL] Error fetching user for touristId ".concat(touristId, " (booking ").concat(bookingId, "):"), userFetchError_1);
                    return [3 /*break*/, 12];
                case 12: return [3 /*break*/, 14];
                case 13:
                    console.warn("[BACKFILL] Booking ".concat(bookingId, " is missing touristId. Cannot backfill name."));
                    _b.label = 14;
                case 14:
                    _i++;
                    return [3 /*break*/, 3];
                case 15:
                    console.log("Script finished. Successfully updated ".concat(updatedCount, " bookings."));
                    return [3 /*break*/, 17];
                case 16:
                    error_1 = _b.sent();
                    console.error("An error occurred during the backfill process:", error_1);
                    return [3 /*break*/, 17];
                case 17: return [2 /*return*/];
            }
        });
    });
}
/**
 * This script will query all bookings, check if 'bookingDate' exists,
 * and if not, add the current date as a Timestamp.
 *
 * To run this script:
 * Ensure you have ts-node installed (`npm install -g ts-node`).
 * Run from your project root: `ts-node scripts/backfillBookingDates.ts`
 * Make sure your .env file has the necessary Firebase configuration.
 */
function backfillBookingDates() {
    return __awaiter(this, void 0, void 0, function () {
        var bookingsRef, q, querySnapshot, updatedCount, now, _i, _a, bookingDoc, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('[BACKFILL] Starting backfill script for booking dates...');
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 7, , 8]);
                    bookingsRef = (0, firestore_1.collection)(db, 'bookings');
                    q = (0, firestore_1.query)(bookingsRef, (0, firestore_1.where)('createdAt', '>', new Date(2000, 0, 1)));
                    return [4 /*yield*/, (0, firestore_1.getDocs)(q)];
                case 2:
                    querySnapshot = _b.sent();
                    console.log("[BACKFILL] Found ".concat(querySnapshot.size, " total bookings."));
                    updatedCount = 0;
                    now = firestore_1.Timestamp.now();
                    _i = 0, _a = querySnapshot.docs;
                    _b.label = 3;
                case 3:
                    if (!(_i < _a.length)) return [3 /*break*/, 6];
                    bookingDoc = _a[_i];
                    if (!!bookingDoc.data().bookingDate) return [3 /*break*/, 5];
                    return [4 /*yield*/, (0, firestore_1.updateDoc)((0, firestore_1.doc)(db, 'bookings', bookingDoc.id), {
                            bookingDate: now
                        })];
                case 4:
                    _b.sent();
                    console.log("[BACKFILL] Added bookingDate to booking ".concat(bookingDoc.id));
                    updatedCount++;
                    _b.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6:
                    console.log("Script finished. Successfully added bookingDate to ".concat(updatedCount, " bookings."));
                    return [3 /*break*/, 8];
                case 7:
                    error_2 = _b.sent();
                    console.error("An error occurred during the booking date backfill process:", error_2);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
// Uncomment one of the following lines to run the desired backfill script:
// backfillBookingNames(); // To backfill customer names
backfillBookingDates(); // To backfill booking dates
