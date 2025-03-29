import getFirebaseAdmin, {
  convertTimestampToISO,
  convertDocToObj,
} from "./firebaseAdminConfig";

// This will throw an error if imported on the client side
const { db, auth } = getFirebaseAdmin();

export { db, auth, convertTimestampToISO, convertDocToObj };
