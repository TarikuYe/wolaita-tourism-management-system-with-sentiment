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
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};
// Initialize Firebase
var app = (0, app_1.initializeApp)(firebaseConfig);
var db = (0, firestore_1.getFirestore)(app);
function deleteBookings(bookingIds) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, bookingIds_1, bookingId, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Deleting selected bookings...');
                    _i = 0, bookingIds_1 = bookingIds;
                    _a.label = 1;
                case 1:
                    if (!(_i < bookingIds_1.length)) return [3 /*break*/, 6];
                    bookingId = bookingIds_1[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, (0, firestore_1.deleteDoc)((0, firestore_1.doc)(db, 'bookings', bookingId))];
                case 3:
                    _a.sent();
                    console.log("Booking with ID: ".concat(bookingId, " has been deleted successfully."));
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error("Error deleting booking with ID: ".concat(bookingId), error_1);
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6:
                    console.log('Finished deleting bookings.');
                    return [2 /*return*/];
            }
        });
    });
}
var bookingsToDelete = [
    "z56zZS4aBRhYLYtHctR1", "yti2JJxq91AXZRZeT534", "yZiuuNlOP7zyYPNvN8C7",
    "xILPcCnZlGlotgFXVCNh", "xGk044Ds16ywjS8iUSDS", "weWFRhcELYIG8aFTPwV4",
    "wXmcxOk7UWnh6XNUcvkT", "viyygyyBVbGmgVEiAwi0", "vQhxiBqcUu6kkTPvjhdj",
    "v6KKEAlZXD39CZBRXYdK", "v3nDkLj87iWRtOY6ew4o", "uN6QcjW7SZzR2hXB0RyH",
    "rZA12ynIjhNCS6KywkwV", "qhcNWEe5T907vniTsyij", "plWj3gVURfGSZhjHDNP6",
    "pBddRcq9pTxlEnsSusHb", "p6ndugm2nMW99NeNxSDL", "otH7bAlTNuzhGis2jkA0",
    "mq3bdwuxeyfY0LAu15XN", "mpivMf47Gy7f0MhWJMIF"
];
deleteBookings(bookingsToDelete).catch(console.error);
