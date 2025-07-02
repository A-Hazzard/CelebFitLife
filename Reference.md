Mux Live Streaming Integration Plan for CelebFitLife (Next.js 15 App)
1. Database Schema Updates (Firestore Streams Collection)
To support Mux live streams, extend the Firestore streams collection with new fields for Mux data. These fields will store Mux-specific identifiers and stream status, alongside existing fields like stream title or owner UID. The key additions include:
muxStreamId (string) – The unique ID of the live stream in Mux (e.g. "QrikEQpEXp3RvklQSHyH..."). This links the Firestore document to the Mux live stream object.


streamKey (string) – The secret stream key provided by Mux for RTMP ingestion. This key is used by the broadcaster’s software or the app to push the live video stream to Mux. It should be stored securely and only exposed to the stream’s owner (treat it like a password).


playbackId (string) – The public playback ID for the live stream. This ID is used to construct the HLS playback URL (e.g. https://stream.mux.com/<playbackId>.m3u8) or to initialize the Mux player for viewers.


status (string) – Current status of the stream, synced with Mux’s live stream status. Possible values: "idle" (waiting/offline), "active" (live and streaming), "disabled" or "ended" (stream ended/terminated). This can be updated via Mux webhooks (e.g., receiving video.live_stream.active or ...idle events). The app will use this to show if a stream is live.


createdAt (timestamp) – Timestamp when the stream was created (could be set from either client or server at creation). If not already in the schema, add this for record-keeping and ordering.


ownerId (string) – Reference to the user who owns/created the stream. (This likely exists already in your schema for permission checks; ensure it’s present if not.)


Optional fields: You may include a title or description for the stream if not already present (for display purposes), and a boolean like isRecorded or a field for a recorded asset ID if you plan to save VODs of the live stream. By default, Mux will create a recording (asset) of the live stream if new_asset_settings are enabled on the stream, so you might store the resulting asset’s ID or use the same playbackId for the recording. This can be an enhancement but is not required for basic live functionality.


Firestore Example (after adding Mux fields):
 A streams document might look like:
{
  "title": "Workout Live Session",
  "ownerId": "user_12345",
  "muxStreamId": "QrikEQpEXp3RvklQSHyHSYOakQkXlRId",
  "streamKey": "v5e59d... (secret)",
  "playbackId": "OJxPwQuByldIr02VfoXDdX6Ynl01MTgC8w02",
  "status": "idle",
  "createdAt": <Timestamp>
}

No existing fields are removed; we are only adding new properties. Ensure your Firestore Security Rules allow the server (or privileged context) to write these Mux fields. For example, only allow the cloud function or Next.js API (with admin privileges) to write streamKey (since it’s sensitive), and allow reading playbackId and status to all clients (or to authorized viewers) so they can watch the stream and see its status.
2. Package Dependencies
Integrating Mux requires installing the Mux SDK for server-side and the Mux player for the client side, along with any supporting libraries. All packages can be added via pnpm:
Mux Node SDK (@mux/mux-node) – Official Mux API client for Node/TypeScript. This will be used in API route handlers (server-side) to create and manage live streams via Mux’s REST API. Install it with:

 pnpm add @mux/mux-node
 Usage: you will initialize a Mux client with your Mux Token ID and Token Secret (from Mux dashboard) as environment variables to authenticate API calls.


Mux Player for React (@mux/mux-player-react) – A React wrapper for the Mux Player web component. This makes it easy to embed the Mux video player into React components to play back the live stream HLS by providing the playbackId. Install with:

 pnpm add @mux/mux-player-react
 This brings in the <MuxPlayer> component for our UI. (Under the hood, it uses Mux’s Web Components for the player.)


Zustand – (Already in use) for state management. No new install needed if it’s already set up. We will create new Zustand stores for streaming state.


Firebase Admin SDK (firebase-admin) – If not already in the project, add this to allow Next.js API routes to interact with Firestore securely from the server side. In a Next.js environment, you might be using Firebase client SDK on the front-end, but for server routes we recommend using the admin SDK to avoid CORS and to use service account privileges. Install with:

 pnpm add firebase-admin
 and initialize it with your service account or Firebase project credentials in the API route handlers (ensuring it’s done once globally to avoid re-init on every call).


Type Definitions – If needed, ensure you have updated TypeScript types. The Mux SDK and player have built-in types. If using any custom libraries for device access or others, include their types (@types/...) as needed. (For example, if you use a validation library or additional helper libraries, install their types.)


shadcn/ui Components – (Already in use) No additional package; just utilize existing shadcn (Radix + Tailwind) components for building forms, modals, buttons, etc. This will ensure the new UI (forms, dialogs) match the app’s design system.


No other specialized packages are strictly required for basic functionality. The browser’s MediaDevices API will be used for camera/microphone access (no extra NPM package needed). If you plan to implement an in-browser RTMP solution (like the Wocket approach for streaming from browser), you might need ffmpeg on the server and possibly a WebSocket library (and perhaps fluent-ffmpeg or similar). However, initially it may be simpler to require an external encoder (OBS or mobile RTMP app) for broadcasting, keeping the scope manageable.
3. File Structure (New & Updated Files)
Below is an outline of new or modified files in the project, along with their purposes. All new files are organized within the existing structure (Next.js App Router directories, components, lib, etc.) for consistency:
lib/services/muxService.ts – (New) A server-side utility module abstracting Mux API calls. It exports functions to create and manage live streams via the Mux Node SDK. For example:


createLiveStream(options): Creates a new Mux live stream (via muxClient.video.liveStreams.create()), with desired settings (e.g. public playback policy, reduced latency if needed).


getLiveStream(muxStreamId): Fetches a live stream’s details (status, etc.) from Mux (muxClient.video.liveStreams.get() or similar).


deleteLiveStream(muxStreamId): Deletes/disables a live stream via Mux API.


signalLiveStreamComplete(muxStreamId): (If needed) Signals to Mux that the live stream is finished, immediately ending the broadcast and finalizing the recording.


verifyWebhookSignature(rawBody, signatureHeader): Verifies Mux webhook signatures (using the signing secret from Mux) to ensure webhooks are authentic.


This service centralizes Mux logic so that API routes can call these functions and remain clean. It will initialize the Mux client with process.env.MUX_TOKEN_ID and MUX_TOKEN_SECRET on first import.


API Route Handlers (Next.js App Router):


app/api/mux/streams/route.ts – (New) Handles POST /api/mux/streams (and possibly GET for listing streams if needed). This route is for creating a new live stream. It uses muxService.createLiveStream to create a Mux live stream and saves the resulting data into Firestore. It returns the new stream info. (If listing all streams is needed, a GET method could be implemented here as well, but primary focus is creation.)


app/api/mux/streams/[id]/route.ts – (New) Dynamic route for a specific stream ID. Handles GET /api/mux/streams/[id] (fetch a single stream’s info) and DELETE /api/mux/streams/[id] (delete a stream). GET will read from Firestore (and optionally refresh status via Mux API), while DELETE will call muxService.deleteLiveStream to disable the Mux stream, then remove the Firestore document.


app/api/mux/streams/[id]/start/route.ts – (New) Handles POST /api/mux/streams/[id]/start. This endpoint will be used to start broadcasting. (Mux live streams technically start when an RTMP feed connects, but this gives our app a hook to mark the stream as starting or initiate the client-side broadcast process.) On request, it can update Firestore status to "starting" and optionally return the streamKey and ingest URL to the client. If using a browser-based streamer, this could also trigger a server process or signal. If an external encoder is used, this is mostly an informative endpoint to log/track the user’s intent to go live.


app/api/mux/streams/[id]/stop/route.ts – (New) Handles POST /api/mux/streams/[id]/stop. Used to stop/terminate a live stream. This can call muxService.signalLiveStreamComplete(muxStreamId) to tell Mux to immediately end the stream (prevent waiting for timeout), and update Firestore status to "ended" (or allow webhook to handle it). If using an integrated broadcaster, it would also instruct that process to stop sending data. After cleanup, respond that the stream is stopped.


app/api/mux/webhooks/route.ts – (New) Handles POST /api/mux/webhooks. This is the public webhook endpoint for Mux to notify our app of live stream events. It will:


Verify the request signature using the Mux signing secret.


Parse the JSON body for event type and data.


Identify which stream the event pertains to (e.g., by data.id for the live stream or data.playback_id for asset events).


Update the corresponding Firestore stream document accordingly. For example, on video.live_stream.active, set status = "active"; on video.live_stream.idle (stream ended), set status = "idle" (or "ended"); on video.asset.live_stream_completed, you might store the recorded asset ID or mark that a recording is available.


Quickly respond with 200 OK (or 204 No Content) to acknowledge the webhook. (Mux expects a 2xx response to consider the webhook delivered successfully.)


Type Definitions:


lib/types/stream.ts – (New) Contains TypeScript interfaces/types for our stream data. This includes the Stream interface defining the shape of a stream document (fields listed in section 1), and possibly related types (e.g., StreamStatus union type, types for Mux webhook payloads if needed). This file helps ensure consistent typing across components and API logic.


Zustand Stores:


lib/store/useStreamStore.ts – (New) Zustand store for stream metadata and streaming state. Manages things like the current stream info and live status (see section 7 for details).


lib/store/useDeviceStore.ts – (New) Zustand store for device (camera/mic) state and permissions. Keeps track of available media devices and user’s selection (see section 7).


UI Components (components/stream/ directory for organization):


components/stream/StreamCreateForm.tsx – (New) Form component to create a new live stream. Allows input of stream title/metadata and triggers the create API route. It likely uses shadcn/UI form elements (e.g. input, label, button) and on submit, calls POST /api/mux/streams then handles the response (e.g., navigate to the new stream’s page or display the stream key details for the user).


components/stream/DeviceTester.tsx – (New) Component to test and select camera, microphone, and speaker devices. It uses the Web Media API to list devices (enumerateDevices), requests permissions (getUserMedia), and provides a preview:


Shows a live video preview from the selected camera.


VU-meter or audio level indicator for the microphone to ensure it’s capturing.


Possibly a test sound button to verify speaker output (using an audio element with the selected output device via setSinkId if supported).


Uses Zustand device store to keep track of device IDs and permission status. Likely rendered as a modal (using shadcn’s Dialog component) or an expandable panel in the stream setup UI.


components/stream/StreamControlPanel.tsx – (New) The control UI for streamers (broadcasters) to manage their live stream. This panel is shown to the stream owner on the stream page. It includes:


Device settings: Possibly renders the DeviceTester (or a button to open it) so the user can configure their camera/mic before going live.


Stream info: Displays the stream title and status (and perhaps the stream key, with a copy-to-clipboard feature for the user to copy into OBS or other software).


Controls: “Start Stream” and “Stop Stream” buttons.


Start: When clicked, if using in-browser streaming, it will start capturing from the selected devices and send to Mux. This could involve connecting to a WebSocket/FFmpeg service or similar. If using external encoder, the Start button might simply confirm that the user is ready (and you might instruct them to start streaming with their external tool). In either case, the UI will update status (and possibly call the /start API to update the backend status).


Stop: When clicked, stops the stream. If external, it might call Mux API to cut the stream (or just mark as stopped). If internal, it stops the media track and closes connections, then calls the /stop API.


Status display: Shows the current stream status (e.g., “🔴 Live” or “🟡 Starting...” or “⚫ Offline”) using the StreamStatusIndicator component.


Viewer count (optional): Could display the number of current viewers. Mux provides an API or even a component for active viewer count, but this can also be done via the Mux Player or periodic checks. This is a nice-to-have; you can integrate it later (Mux has a <mux-active-viewer-count> web component if desired).


components/stream/MuxPlayerWrapper.tsx – (New) A React component wrapping the Mux player for the viewer side. It encapsulates the <MuxPlayer> component from @mux/mux-player-react and sets it up with the stream’s playback ID and desired options:


Props might include playbackId (required) and perhaps booleans like autoPlay, showControls, etc.


Example usage inside: <MuxPlayer playbackId={playbackId} streamType="live" controls autoPlay /> along with some UI customization (you can set aspectRatio or poster image, and an accentColor to match brand styling).


This wrapper can also handle state like showing a loader or a message if the stream is not live yet. For instance, if status !== 'active', it could either render nothing or show “Stream is offline” until it goes live.


If the stream is live, the MuxPlayer will play the live HLS feed; if the stream ended and Mux recorded it, the same playbackId will play the VOD of the stream (since we set playback policy to public, the live playback ID becomes a playback ID for the recorded asset as well).


components/stream/StreamStatusIndicator.tsx – (New) A small UI component (could be just an icon + text) to display the stream’s status in a user-friendly way. For example:


If status is "active" (live), show a red dot 🟢 or 🔴 and the text “Live” (perhaps styled in red).


If "idle" or offline, show a gray dot and “Offline”.


If starting or reconnecting, show a yellow dot and “Starting…” or “Reconnecting…”.


This component can be used in the control panel, and also next to stream titles in a list of streams or on the video player overlay to indicate live/offline state.


Pages:


app/streams/[id]/page.tsx – (Updated/New) This page displays a specific stream. If it didn’t exist, create it. The content of this page will vary based on whether the user is the owner (streamer) or a viewer:


Streamer view: Show the StreamControlPanel and perhaps a preview. The preview could just be the local DeviceTester’s video or the MuxPlayer (though MuxPlayer will be 10-30s behind due to HLS latency, so streamers typically rely on local preview rather than the HLS feed). You might show a note “Use the control panel to start streaming. Once live, viewers will see the video below.”


Viewer view: Show the MuxPlayerWrapper front and center to watch the live stream. Also show the stream title, the StreamStatusIndicator (to show if it’s live), and possibly any interactive elements (chat, like buttons, etc., if those exist in the app).


The page can fetch the stream document (via Firestore or via the GET API) using params.id. It should pass the relevant data to child components (playbackId to the player, etc.). Using Next.js 13 App Router, this page can be an RSC (React Server Component) that loads initial data (like stream title, etc.), and then uses client components for interactive parts (player and controls).


app/streams/new/page.tsx – (New, optional) If you prefer a separate page for creating a new stream, you can have a page that renders the StreamCreateForm. Alternatively, the creation form could be a dialog or part of some dashboard page. In either case, ensure it’s accessible for users to initiate creating a stream.


All new files should follow the existing code style and project structure. For example, use TypeScript and functional React components, and match any linting/prettier rules. Placing these in logical directories (components/stream, lib/services, lib/types, lib/store) will keep the project organized.
4. API Routes and Endpoints
We will implement a set of RESTful API endpoints under /api/mux/* to handle stream lifecycle actions. These endpoints will interact with the Mux API (via muxService) and Firestore. Each route includes input validation and returns JSON responses. Below is a detailed specification for each endpoint:
POST /api/mux/streams – Create a new live stream.
 Purpose: Creates a Mux live stream and a corresponding Firestore stream document. This is called when a user submits the “create stream” form.
 Input: JSON body with stream details. At minimum, include a title (string) for the stream. You could allow other options like description or a latencyMode (e.g., "reduced" or "low" latency) toggle, which if present can be passed to Mux (e.g., { latency_mode: "low" }). Basic example input: { "title": "My Live Class" }.
 Behavior:


Validate that the user is authenticated (e.g., via Next.js middleware or checking the session in the handler) and has permission to create streams (if you have role-based access). Ensure required fields (like title) are present and not empty.


Use the Mux SDK to create a new live stream. For example:

 const muxStream = await muxClient.video.liveStreams.create({
  playback_policy: ['public'],
  new_asset_settings: { playback_policy: ['public'] },
  // optional: latency_mode: 'low' 
});
 This call returns a JSON with the Mux stream’s id, stream_key, status (initially “idle”), and a playback_ids array. From that, extract the necessary fields (muxStream.id, muxStream.stream_key, muxStream.playback_ids[0].id).


Create a new document in Firestore streams collection with the combined data:


title (from request),


ownerId (from auth context),


muxStreamId, streamKey, playbackId,


status (initially "idle"),


createdAt (server Timestamp).


Return a 201 Created response with the stream data. For example:

 {
  "id": "<FirestoreDocID>",
  "title": "My Live Class",
  "muxStreamId": "<Mux Live Stream ID>",
  "streamKey": "<Mux Stream Key>",
  "playbackId": "<Mux Playback ID>",
  "status": "idle"
}
 (You may exclude the streamKey in the response for security and only show it in the UI for the owner, but including it in the JSON response to the creator is convenient since only the owner can call this.). If validation fails or Mux API errors, respond with 400 (with error message) or 500 accordingly.
 Example Response: (Success, 201)


{
  "id": "stream_abc123",
  "muxStreamId": "QrikEQpEXp3RvklQSHyHS...",
  "streamKey": "super-secret-stream-key",
  "playbackId": "OJxPwQuByldIr02VfoXDdX6Ynl01MTgC8w02",
  "status": "idle"
}
 This indicates a new stream is set up in idle state. The client (StreamCreateForm) can now route the user to the stream page or display the connection info.


GET /api/mux/streams/[id] – Get stream info/status.
 Purpose: Fetches the latest info about a specific stream (by Firestore document ID). This can be used to retrieve stream status or details on demand (though much of the time the client can subscribe to Firestore or use webhooks).
 Input: The stream ID is provided in the URL path. No body required.
 Behavior:


Verify the requesting user has access (e.g., the stream is public or the user is the owner). If unauthorized, return 403.


Retrieve the stream document from Firestore by id. If not found, return 404.


Optionally, cross-check or update status via Mux: you can call muxService.getLiveStream(muxStreamId) to get the current status from Mux, especially to know if it’s live. If the status in Firestore is stale, update it. (Webhooks should normally keep it updated, but polling here is a backup.)


Return 200 OK with the stream data in JSON (similar shape as shown above, minus sensitive fields if the caller shouldn’t see them). For example, viewers might get { id, title, playbackId, status } but not the stream key. The owner could get all fields. Tailor the response based on user role as needed.
 Example Response: (Owner requesting, 200)


{
  "id": "stream_abc123",
  "title": "My Live Class",
  "muxStreamId": "QrikEQpEXp3RvklQSHyHS...",
  "playbackId": "OJxPwQuByldIr02VfoXDdX6Ynl01MTgC8w02",
  "status": "active",
  "startedAt": "2025-07-01T10:00:00Z"
}
 (This shows the stream is currently active. startedAt could be a field you set when the stream went live, either via webhook or when start was pressed.)


POST /api/mux/streams/[id]/start – Start a stream broadcast.
 Purpose: Signals the intention to start streaming. It may also initiate any server-side streaming pipeline if the app handles broadcasting.
 Input: The stream ID in URL; body is optional. (No body is needed for a simple implementation. Optionally, you could allow a body like { "useCamera": true } to indicate the user wants to use the browser camera.)
 Behavior:


Authenticate the user (must be the stream owner) and that the stream is in a state that can be started (e.g., currently "idle" and not already active).


If using an external encoder (OBS/app): This endpoint might not perform much logic – the actual start happens when the encoder connects to Mux. In this case, you can use this endpoint to update Firestore status to "starting" (or a similar interim state) and perhaps provide the stream key & RTMP URL back to the client for convenience. The client (control panel) could display “Starting…” and expect a webhook update to “active” once Mux gets the stream. There’s no Mux API call needed to start; it’s triggered by the incoming stream.


If using an in-app broadcaster: Here, this endpoint can orchestrate the start of streaming:


Possibly generate or fetch a short-lived upload URL or stream key (not needed, we already have streamKey).


Respond with the info needed for the client to begin pushing video (e.g., the streamKey and ingest URL rtmps://global-live.mux.com:443/app). The client could then start a WebSocket to a server which runs ffmpeg, etc. This is complex, so it might be handled outside this request (for instance, the client might open a persistent connection on its own).


Alternatively, this endpoint could trigger a backend streaming process. For example, if using a headless FFmpeg on the server to pull from the client’s WebRTC feed, you might allocate a server resource here.


For our plan, we assume external or a simpler approach, so we won’t deeply implement FFmpeg here.


Respond with 200 OK on success. Response can include a message and relevant data:

 { "message": "Stream starting", "streamKey": "<key>", "rtmpUrl": "rtmps://global-live.mux.com:443/app" }
 The rtmpUrl is Mux’s ingest endpoint (port 443 for RTMPS) that the broadcaster should use along with the key. (Mux’s RTMP server URL is rtmp://global-live.mux.com:5222/app or rtmps://global-live.mux.com:443/app.) This gives the streamer the info needed to connect their encoder.


Side effect: Firestore stream status can be set to a transient “starting” state. If using webhooks, once Mux sees the RTMP feed, you’ll get video.live_stream.connected and then ...active events to update status to “active”.


POST /api/mux/streams/[id]/stop – Stop (end) the live stream.
 Purpose: Gracefully end a live stream broadcast. This might be triggered by the streamer clicking “Stop” in the UI.
 Input: Stream ID in URL; body optional (not needed typically).
 Behavior:


Authenticate user (owner). Ensure the stream is currently live or starting.


Call Mux to end the stream immediately: use the Mux Node SDK’s termination endpoint (Mux provides a “signal complete” API to immediately end a live stream, which otherwise might wait for a timeout if the encoder simply disconnects). For example:

 await muxClient.video.liveStreams.signalComplete(muxStreamId);
 This signals Mux to consider the stream finished and finalize the recording (if any).


Update Firestore: set status = "ended" (or you could rely on the incoming webhook video.live_stream.idle and video.asset.live_stream_completed to update status and perhaps attach a recording URL).


Respond with 200 OK (or 204 No Content). Example response:

 { "message": "Stream stopped." }
 The client UI should reflect that the stream is no longer live (e.g., show “Stream ended”). If a recorded video is available, the app could now display a playback of the recorded stream or a message that the stream has ended.


DELETE /api/mux/streams/[id] – Delete a stream.
 Purpose: Permanently delete a stream entry. This will disable the Mux live stream (revoking its stream key) and remove the entry from our database. Use with caution (probably only accessible to admins or the stream owner when the stream is not active).
 Input: Stream ID in URL.
 Behavior:


Authenticate (owner or admin) and ensure the stream is not currently active (to avoid deleting an in-progress stream; if needed, force-stop it first).


Call muxClient.video.liveStreams.del(muxStreamId) (using the Mux SDK) to delete the live stream on Mux. This will invalidate its stream key and prevent further broadcasts. If the stream was active or waiting, Mux might emit a webhook for idle/disabled.


Delete the Firestore document for this stream.


Respond with 204 No Content (no body). Or 200 OK with a simple JSON confirmation:

 { "message": "Stream deleted." }


After this, the stream will no longer exist in our system or on Mux. (If there was a recording asset, that remains in Mux as a separate object unless you choose to delete it too via Mux Asset API.)


POST /api/mux/webhooks – Mux Webhook receiver.
 Purpose: Receive asynchronous event notifications from Mux about live stream status changes and record creations. This is crucial to update the app in real-time when a stream goes live or offline, without constant polling.
 Input: Mux will send an HTTP POST with a JSON body containing an event object. The header will include a signature (e.g., mux-signature) that we must verify.
 Behavior:


Verification: Compute an HMAC SHA256 of the raw request body using the Mux Webhook Signing Secret, and compare with the signature header to ensure authenticity. If verification fails, respond 400 and do not process.


Parse the type of event and the associated data. Relevant live stream events include:


video.live_stream.connected – Encoder has connected to Mux (stream about to start, not yet playable).


video.live_stream.active – The live stream is now live and playable (Mux is ingesting and broadcasting).


video.live_stream.disconnected – The encoder disconnected (but within reconnect window, so stream might come back).


video.live_stream.idle – The live stream went offline and the reconnect window expired (stream truly ended).


video.asset.live_stream_completed – The recorded asset of the stream is ready (the live stream session has ended and a VOD asset is finalized).


Determine the affected stream: for live_stream.* events, data.id will be the Mux stream’s ID. Use that to lookup the corresponding Firestore doc (where muxStreamId == data.id). For the asset event, data.live_stream_id might be provided or you may need to map the asset to the stream (Mux documentation indicates the asset will have live_stream_id referencing the stream).


Update Firestore accordingly:


On ...connected: Update status to "connected" (if you distinguish this) or "active" (since connected is a precursor to active – possibly you skip this and wait for active).


On ...active: Update status to "active" (stream is live). You might also record a startedAt timestamp if needed.


On ...disconnected: If Mux allows reconnect (default 2-minute window), you might set status to “disconnected” or “reconnecting”. The stream isn’t fully offline until idle, but you can note it.


On ...idle: Update status to "idle" or "ended". This indicates the live stream has ended and no reconnection happened in the allowed window. At this point, you know the live session is complete.


On video.asset.live_stream_completed: This event contains the asset (recording) ID of the completed stream. You can store lastAssetId or a recordingPlaybackId in the stream doc. However, since we set the live stream with a public playback policy, the original playbackId will now serve the recorded video as VOD. You may still want to note that the stream has a recording available.


Respond quickly with 200 OK (JSON body optional). For example:

 { "message": "Webhook received" }
 Mux only needs a 2xx status; any content is optional. In code, you might just do return NextResponse.json({ message: 'ok' }) or similar.


Security: This endpoint should be configured as a server-only route (which Next.js API routes are by default) and the URL kept secret except to Mux. Set up the webhook in the Mux Dashboard to point to your deployment (e.g., https://yourapp.com/api/mux/webhooks) and provide the secret for verification. Use a strong random secret from Mux to avoid tampering.


Validation & Error Handling: Each endpoint should validate inputs:
Use TypeScript/Zod schemas or simple checks (e.g., ensure title is a non-empty string for create, ensure IDs are correctly formatted if needed, etc.).


Ensure only authorized users can create, start, stop, or delete streams. For instance, check ownerId in Firestore matches the user ID from the session.


Return appropriate HTTP status codes (400 for bad input, 403 for forbidden, 404 for not found, 500 for server errors, etc.) and error messages in JSON (e.g., { error: "description" }).


By structuring the API this way, the Next.js app’s frontend can interact with these endpoints to manage live streams. For example, the StreamControlPanel will call /api/mux/streams/[id]/start when the user clicks "Start Stream", and the app can rely on webhooks (or GET polling) to update the UI when the stream actually goes live on Mux.
5. React Components (UI) for Live Streaming
We will create several React components to handle the user interface for live streaming features. These components leverage the existing design system (shadcn/ui and Tailwind CSS) and integrate with Zustand state where appropriate:
StreamCreateForm.tsx – Stream Creation Form.
 Purpose: Allows a user to create a new live stream entry. It likely includes input fields for stream title (and perhaps privacy or latency options) and a submit button.
 Details:


Use a controlled form or a library (shadcn’s form components or React Hook Form) for inputs. Minimal fields: Title (text). Optionally a toggle for "Low Latency" mode or "Record stream" (which could set parameters for Mux).


On submit, call the POST /api/mux/streams endpoint. This can be done with fetch or Axios. Provide feedback during loading (disable button, show spinner).


Handle the response: if successful, you might navigate to the new stream’s page using Next.js router (e.g., router.push("/streams/[id]")). The new stream ID can come from the response JSON. Also possibly display the stream key info to the user (if you want them to copy it now).


If there's an error (e.g., missing title or API failure), display a validation message or error alert (using shadcn’s Alert or Toast component).


UI/UX: Use shadcn text field and button components. Possibly wrap the form in a Card or Modal if it’s a popup. Ensure it looks consistent with the app’s theme.


DeviceTester.tsx – Device Selection & Test Panel.
 Purpose: Allows the streamer to select which camera, microphone, and speaker (output) to use, and test them before going live. This improves confidence that everything is working.
 Details:


On mount, request media device permissions if not already granted. For example, call navigator.mediaDevices.getUserMedia({ video: true, audio: true }) with minimal constraints to prompt the user for access. Use try/catch to handle if permission is denied.


Then call navigator.mediaDevices.enumerateDevices() to list all available devices. Filter by kind (videoinput for cameras, audioinput for mics, audiooutput for speakers) and store these lists in the device Zustand store (see section 7). The store will hold arrays of device info and the currently selected device IDs.


Provide UI dropdowns (select menus) for Camera, Microphone, and Speaker selection. Populate options using the device lists from state. When the user changes a selection, update the Zustand store (which can also store the chosen device IDs).


Display a video preview element for the camera:


Use the selected camera ID in getUserMedia to get a stream ({ video: { deviceId: selectedCameraId }, audio: false }). Set the video element’s srcObject to this stream to show a live preview.


If the user changes camera, switch the stream accordingly.


Test microphone:


You can capture audio with getUserMedia({ audio: { deviceId: selectedMicId } }) (perhaps already got it alongside video). To give feedback, you might visualize audio levels. One simple way: create an AudioContext and an AnalyserNode to get volume levels from the mic stream, and show a volume bar or moving indicator. Or simpler, just indicate “Microphone detected” if we get data.


Test speakers:


For output, create an <audio> element in the DOM that plays a test tone or sound file. Use HTMLAudioElement’s setSinkId(selectedSpeakerId) (note: this is supported in Chrome for output device selection) to route audio to the selected output. Provide a “Test Sound” button that when clicked, plays the audio (e.g., a short beep or music clip).


Layout: This component could be a modal dialog (opened from the StreamControlPanel via a “Device settings” button). In the modal, show the preview video, and form controls for device selection. Use shadcn’s Dialog, with the form inside the dialog content.


Provide a “Save” or “Close” action that simply closes the dialog. The selections remain in the Zustand store for later use when starting the stream.


Note: The device tester should handle permission issues gracefully. If the user denies camera/mic access, show an error message and guidance to enable it. Also, remember to stop any media tracks when unmounting the component to free the camera.


StreamControlPanel.tsx – Streamer Control Panel.
 Purpose: UI for stream owners to manage the live stream session (setup devices, go live, end stream, monitor status).
 Details:


This panel will typically be displayed on the stream page, only for the owner. It can be a sidebar or a section above the video player.


Device Setup: Include a button or section to configure devices. For example, a “Setup Camera & Mic” button that opens the DeviceTester dialog. You might show the name of the currently selected camera/mic for quick reference. Ensure the user has done this before starting.


Stream Info: Display the stream’s title and possibly the stream key (only show stream key to the owner). For example, “Stream Key: XXXX-XXXX-....” with a copy-to-clipboard icon. Warn the user to keep it secret. If the app expects the user to use OBS or another encoder, also display “RTMP URL: rtmp://global-live.mux.com:5222/app”. This allows them to quickly copy those into their encoder if needed.


Status Indicator: Use the StreamStatusIndicator component to show current status (e.g., “Status: 🔴 Live” or “Status: Offline”). This can be updated in real-time via Zustand (the store can be updated by webhooks or polling).


Controls (Start/Stop):


Render a Start Stream button (probably styled as a primary action).


On click: if using in-browser streaming, gather the selected devices and begin the streaming process. This might involve connecting to a streaming server or initiating a MediaRecorder + WebSocket pipeline. For example, you could call the /start API to mark as starting, then begin capturing: start reading the video stream (from camera) and audio stream (from mic), and feed them to your backend (via WebRTC or WebSocket). (The specifics of implementing the actual media upload are complex; see the Wocket project for reference, which uses a WebSocket to send media to a Node server running ffmpeg to Mux).


If using external encoder: the Start button could simply display the stream key/URL info (if not shown yet) and instruct the user to start streaming from their external app. In this case, upon clicking Start, you might set status to "starting" and then rely on the Mux webhook (active) to automatically switch status to live. The Start button could also become disabled or turn into a “Live” indicator once streaming.


Provide feedback: disable the Start button once clicked (to prevent double actions) and maybe show a spinner or “Connecting…” state until active.


Stop Stream button (styled as a secondary or a red danger button).


On click: call the POST /api/mux/streams/[id]/stop endpoint to signal Mux to end the stream, and if using internal streaming, also stop the local media capture (stop tracks, close connections).


After stopping, update the UI: the status should switch to offline, and the Start button can become enabled again (if you allow restarting the stream with a new Mux stream or if the same stream can be reused after some cooldown).


If a recording is available, you could inform the streamer “Your stream has ended. A recording will be available for playback.” (Optional enhancement.)


Ensure proper confirmation: accidental stops could be mitigated by a confirmation dialog, since stopping will cut off viewers.


Viewer Count (Optional): If desired, show a live viewer count. You could integrate Mux Data or use the Mux real-time API to fetch viewer counts. Mux has a web component <mux-active-viewer-count> that can be placed inside a Mux Player or standalone to display current watchers. For simplicity, this can be added later. In our initial plan, we may skip it or just leave a placeholder.


Styling: Use a panel or card UI from shadcn. Possibly arrange as follows: Title at top, status indicator next to title. Section for stream key/RTMP info. Section for devices (with a gear icon to open DeviceTester). Then Start/Stop controls at the bottom. This should be responsive (on mobile, maybe collapse some info).


MuxPlayerWrapper.tsx – Live Video Player Component.
 Purpose: Displays the live stream video to viewers (and can be used by the streamer to monitor). Wraps the Mux Player and handles state like loading and errors.
 Details:


This component will receive at least a playbackId prop (the Mux playback ID for the stream to play). It could also accept a streamStatus prop to know if the stream is live or offline.


Internally, it renders the <MuxPlayer> component from @mux/mux-player-react. Basic usage:

 <MuxPlayer
  playbackId={playbackId}
  streamType="live"
  controls
  autoPlay
  metadata={{
    video_title: title,
    viewer_user_id: userId  // example metadata
  }}
  style={{ aspectRatio: "16/9" }}
/>
 The streamType="live" prop optimizes the player for live streaming (e.g., shows a “live” badge and disables seeking). The metadata is optional, but you can pass things like title for analytics. controls gives play/pause controls (for live, play/pause is basically mute/unmute and a play button if the stream stalls). autoPlay will try to start playing immediately (note: some browsers will block autoplay unless muted or user interaction, but since it’s live content user expects it).


Offline handling: If streamStatus !== 'active', you might want to conditionally render a placeholder instead of the player. For example, if the stream is not live yet, display a message: “The stream is currently offline. Please check back later.” or a branded image. You can check this before rendering MuxPlayer to avoid a player with a loading spinner sitting there indefinitely.


Loading state: The MuxPlayer fires events (like onPlaybackStatusChange, onError). You can use these to show a loader or error message. For instance, when first loading, show a spinner until the player either plays or errors out.


Styling and responsiveness: You may want the player to be responsive. MuxPlayer by default will expand to fill its container. Wrapping it in a div with a specific aspect ratio (16:9) can maintain a consistent video area. shadcn’s AspectRatio component could be useful (if included in your components).


Customization: You can customize the MuxPlayer controls and appearance (accent color, etc.). For example, <MuxPlayer playbackId={...} primaryColor="#FF0000" /> (or accentColor as per docs) to match your brand. According to Mux docs, you can pass an accentColor prop.


Example: For a given playbackId, the player will play the live stream when active. The underlying HLS manifest is https://stream.mux.com/{playbackId}.m3u8. MuxPlayer takes care of HLS playback (using low-latency LLDash/HLS if enabled).


In summary, this wrapper’s job is mainly to manage conditional display (show player if live, message if not) and to encapsulate any player configuration. It doesn’t need heavy logic since the Mux player is doing the work.


StreamStatusIndicator.tsx – Stream Status Display.
 Purpose: A small component to show the current status of a stream in text/icon form, used in multiple places (control panel, stream list, etc.).
 Details:


It takes a status prop (which can be a union type of 'idle' | 'active' | 'starting' | 'disconnected' | ...). Based on the value, it renders a colored dot and a label:


If status is "active" (live): render a red dot (could use a CSS background-circle or an emoji 🔴) followed by “Live”. Possibly make the text itself red or use a badge component with a red background (Shadcn’s Badge could be styled accordingly).


If "idle" or "offline": gray dot, “Offline” (or “Not live”).


If "starting": yellow/orange dot, “Starting” (meaning the stream is about to go live).


If "disconnected" (temporarily dropped): orange dot, “Interrupted” or “Reconnecting…”.


If "ended": could show gray dot and “Ended”.


This component is purely presentational. It can be implemented as a simple function component with conditional logic or a small lookup map of status -> style/text.


Use it in the UI wherever a quick status is needed:


In StreamControlPanel (e.g., “Status: ”).


On stream listing pages or profile pages showing the stream – so viewers can see which streams are live.


Ensure it updates reactively: e.g., if using Zustand or props from parent, when status changes, this should re-render and show the new state.


All these components work together to provide a seamless live streaming UI. The typical flow is: user goes to “Create Stream” -> fills form -> gets to stream page -> sets up devices -> hits “Start” -> stream goes live via Mux -> viewers see the video via MuxPlayer -> user can “Stop” -> stream ends.
We will leverage existing design components from shadcn/UI for a consistent look (forms, buttons, modals, badges, etc.). For example, use <Button> for Start/Stop with variant colors, use <Dialog> for the device tester, <Input> for text fields, etc. This ensures the new UI feels integrated with the rest of CelebFitLife.
6. TypeScript Types (lib/types/stream.ts)
Defining clear TypeScript types for our stream data and related entities will make development easier and less error-prone. In lib/types/stream.ts, we will add:
Stream Interface: Represents a live stream object as stored in Firestore (and used in the app). For example:

 export interface Stream {
  id: string;             // Firestore document ID for the stream
  title: string;          // Stream title or name
  ownerId: string;        // UID of the user who owns the stream
  muxStreamId: string;    // Mux Live Stream ID
  streamKey: string;      // Mux stream key (secret)
  playbackId: string;     // Mux playback ID for HLS playback
  status: StreamStatus;   // Current status (idle, active, etc.)
  createdAt: Timestamp;   // Firestore timestamp of creation
  startedAt?: Timestamp;  // When stream actually went live (optional, set via webhook)
  endedAt?: Timestamp;    // When stream ended (optional)
  // Optional fields:
  description?: string;
  lastAssetId?: string;   // If recorded, the Mux Asset ID of the last stream recording
}
 This interface will be used in components and API handlers to type the data. The Timestamp type can be from Firebase (firebase.firestore.Timestamp or a placeholder if using admin SDK, etc.). If not using Firestore’s Timestamp, you could use Date or ISO string for times in your app.


StreamStatus Type: Define as a string union of possible statuses, e.g.:

 export type StreamStatus = 'idle' | 'active' | 'starting' | 'disconnected' | 'ended';
 This helps ensure we only assign valid status values. We map these to Mux events: initially 'idle', when live 'active', if user clicked start maybe 'starting', after end 'ended'. (You might not use all states; adjust as needed.)


MuxLiveStreamEvent and MuxWebhookPayload (optional): If we want strong typing for webhook handling, we can define types for the Mux webhook JSON structure. For example:

 interface MuxWebhookPayload {
  type: string;
  data: any;
  id: string;
  object: string;
  environment: { ... };
  // etc., as per Mux webhook spec
}
interface LiveStreamActiveEventData {
  id: string; // Mux stream ID
  status: 'active' | 'idle' | ...;
  // other fields like playback_ids, etc.
}
 We might not enumerate everything, but at least typing the event type (like 'video.live_stream.active' | 'video.live_stream.idle' | ...) could be useful. However, for simplicity, this can also be handled with string literal comparisons in code without dedicated types.


DeviceInfo (optional): If needed, define a type for media devices if not using the built-in MediaDeviceInfo. But since MediaDeviceInfo is a DOM type available globally, we can use that directly in our Zustand store types.


StreamPermission (optional): If you have complex permission logic, you might define a type or enum for roles allowed to stream (e.g., if in future not every user can create streams). For now, this might be unnecessary.


By defining these types, we get autocomplete and compile-time checks. For example, when updating Stream.status, TypeScript will enforce that the new value is a valid StreamStatus. Also, components like StreamStatusIndicator can accept status: StreamStatus for clarity.
We will also use these types in our Zustand stores. For instance, useStreamStore might have a state field currentStream?: Stream and methods that accept a Stream type.
7. Zustand State Stores (Structure for Devices, Stream Data, Permissions)
We will use Zustand to manage client-side state for the live streaming features. Two separate store slices make sense: one for device/camera state and one for stream session state. This separation follows the principle of keeping unrelated state isolated and makes it easier to manage:
Device Store (useDeviceStore) – manages camera/mic/speaker devices and user permissions.
 State fields:


cameraDevices: MediaDeviceInfo[] – list of available video input devices (cameras).


micDevices: MediaDeviceInfo[] – list of available audio input devices (microphones).


speakerDevices: MediaDeviceInfo[] – list of available audio output devices (speakers/headphones).


selectedCameraId: string | null – device ID of the chosen camera (from cameraDevices).


selectedMicId: string | null – device ID of the chosen microphone.


selectedSpeakerId: string | null – device ID of chosen audio output.


camPermissionGranted: boolean – whether the user has granted webcam access.


micPermissionGranted: boolean – whether the user has granted microphone access.


permissionError: string | null – error message if permissions were denied or any issue accessing devices (for UI to display).


(Optional) previewStream: MediaStream | null – a live MediaStream for the selected camera (and maybe mic) that can be used for preview in the DeviceTester. This could also just be managed internally in the component, but storing it allows reuse if needed.
 Actions:


getDevicesList: () => Promise<void> – enumerates devices and populates cameraDevices, micDevices, speakerDevices. This uses navigator.mediaDevices.enumerateDevices(). Should be called after permissions are granted.


requestPermissions: () => Promise<void> – triggers getUserMedia to ask for cam/mic access. For example, call navigator.mediaDevices.getUserMedia({ video: true, audio: true }) and then immediately stop the tracks (we just want permission, not continuous usage here). If successful, set camPermissionGranted and micPermissionGranted to true. If error (user denied), set permissionError.


setSelectedCamera: (deviceId: string) => void – update selectedCameraId.


setSelectedMic: (deviceId: string) => void – update selectedMicId.


setSelectedSpeaker: (deviceId: string) => void – update selectedSpeakerId.


createPreviewStream: () => Promise<void> – using the currently selected camera/mic IDs, open a MediaStream for preview. E.g., navigator.mediaDevices.getUserMedia({ video: { deviceId: selectedCameraId }, audio: { deviceId: selectedMicId } }) and store it in previewStream. The DeviceTester component can then attach this stream to a video element. This might also handle switching streams when selections change.


stopPreviewStream: () => void – stops all tracks in the previewStream and sets it to null (clean up when done).
 Usage: The DeviceTester component will heavily use this store: to populate dropdowns with cameraDevices/micDevices, to know currently selected devices, and to create/stop the preview stream. The store makes sure these values persist even if the component unmounts (the selection can remain until page unload or user changes it).


Stream Store (useStreamStore) – manages the current live stream session state.
 State fields:


currentStream: Stream | null – the stream being viewed or managed by the user. This would be set when on a stream page (e.g., fetched from Firestore or via props). Contains all info like id, title, playbackId, status, ownerId, ....


isOwner: boolean – whether the current user is the owner of currentStream. This can be derived (e.g., compare user.uid to currentStream.ownerId), or stored for convenience.


status: StreamStatus – the current status of the stream (could mirror currentStream.status for easy access, or even be a getter). This will update in real-time via webhooks or polling. The store can provide an action to update status.


viewerCount: number – (optional) current number of viewers. If we integrate a way to get this (through webhooks or a periodic fetch to Mux stats), we can store it here. Mux’s real-time viewer count API could be used in the future; for now this might remain 0 or be updated via some polling on the client.


error: string | null – any error related to streaming (e.g., failed to start stream, etc.) that the UI can display.


isStarting: boolean – flag indicating a start request is in progress (to manage UI state of the Start button).


(If implementing in-browser streaming) streamSocket: WebSocket | null – handle to a WebSocket connection to the server (for pushing media), if applicable. And maybe isStreaming: boolean (redundant with status “active”, but could track if the local pipeline is active).
 Actions:


setCurrentStream: (stream: Stream) => void – initialize the store for a particular stream (called when loading the stream page).


updateStatus: (status: StreamStatus) => void – update the status field (called when a webhook message comes in via SSE, WebSocket, or polling mechanism). In a Next.js app, you might not have a direct real-time pipeline from server to client unless you implement one (e.g., use Firestore’s snapshot listener in a client component instead of webhooks to update status, which is an alternative approach). If using Firestore client SDK, you might not need this action because you could use a Firestore listener to update React state. But with Zustand, you could integrate that listener to call this.


startStream: () => Promise<void> – logic to handle clicking “Start Stream”.


This would likely call the API endpoint /api/mux/streams/[id]/start.


If external encoder: it might just set isStarting=true and wait for a webhook to set active.


If internal: it could also open the WebSocket to your Node server, then use MediaRecorder on deviceStore.previewStream to send data chunks through the socket (see Wocket’s approach using MediaRecorder dataavailable events to send binary data to server). This is complex, so for now, startStream might simply call the API and rely on external software.


On success (or after initiating internal streaming), set isStarting=false. If internal, also set isStreaming=true once data is flowing.


stopStream: () => Promise<void> – handles stopping the stream.


Call /api/mux/streams/[id]/stop to notify server/Mux.


If internal streaming, also close the MediaRecorder or WebSocket so that data flow stops.


Set isStreaming=false.


Optionally, await confirmation (maybe via webhook updating status to idle) to then update UI.


setError: (msg: string) => void – to record any errors (like if start fails).
 Usage: The StreamControlPanel will use this store to get currentStream (for info like title), status for the indicator, and to call startStream/stopStream actions on button clicks. The MuxPlayerWrapper might also subscribe to status to decide if it should render. Because Firestore updates or webhook updates should ultimately flow to the client, consider how to propagate them:


If using Firestore client SDK, you can set up onSnapshot on the stream doc in a client component and then call updateStatus when it changes.


If not, you might implement server-sent events or Next.js revalidation, but Firestore’s real-time listeners are easiest on client side. Given you already use Firebase, leveraging it on the client could simplify status sync (the server webhook updates Firestore, and Firebase SDK notifies the client of the doc change).


Permissions Consideration: The mention of permissions in the prompt likely refers to device permissions (camera/mic) and user auth roles. Device permission flags are handled in useDeviceStore as above (camPermissionGranted, etc.). User auth (like whether the user can create/stream) might be globally available via your existing auth context, so we may not need a Zustand store for that specifically. However, isOwner in useStreamStore is a kind of permission flag for the current stream. We already included that logic to ensure UI shows the right controls.


Integrating Stores: You might initialize these stores in your app (Zustand doesn’t require a provider; components can just import and use the hooks). Ensure to create the store with proper devtools naming and possibly persistence if needed (not necessary for these ephemeral states).


Example Zustand usage: In a component, you might do:
const { cameraDevices, selectedCameraId, setSelectedCamera } = useDeviceStore();
const { currentStream, status, startStream } = useStreamStore();

This gives access to the needed state. By structuring as above, we keep device-specific logic separate from stream session logic, which is cleaner.
In summary, the Zustand stores will help coordinate between components:
The DeviceTester and ControlPanel share device selection state via useDeviceStore.


The ControlPanel, Player, and possibly some banner or UI share stream status via useStreamStore.


The webhooks or Firestore listeners will update the useStreamStore.status so that all UI components reflect changes (like going live or offline) immediately.


8. Implementation Steps (Chronological Plan)
Finally, here is a step-by-step plan to implement the Mux live streaming integration from start to finish. This sequence ensures the foundational pieces (Mux setup, backend routes) are in place before the UI and streaming logic.
Obtain Mux Credentials & Configure Environment:


Sign up for a Mux account (if not done) and create an API Access Token with Full Access to the Mux Video API. Note the Token ID and Token Secret. Also generate a Signing Secret for webhooks (in the Mux dashboard’s webhook settings).


In the Next.js project, add these to your environment variables. For example, in your local .env and in your deployment platform (Vercel) add:

 MUX_TOKEN_ID=<your Mux token ID>
MUX_TOKEN_SECRET=<your Mux token secret>
MUX_WEBHOOK_SECRET=<your Mux webhook signing secret>
 Also ensure Firebase credentials (service account or config) are in env if using admin SDK.


Update next.config.js if needed to expose any public config (though these Mux vars should stay server-side). No need to expose secrets to client.


Update Firestore Schema & Security Rules:


Plan the addition of new fields (muxStreamId, streamKey, playbackId, status, etc.) as outlined in section 1. If you have existing stream documents, decide how to migrate them (if they were just placeholders, you might recreate them via the new system or add null defaults).


Update Firestore Security Rules accordingly:


Only allow stream owners (or your server/admin) to write sensitive fields. For instance, you might disallow clients from writing muxStreamId or streamKey on their own. Instead, these should be set by privileged server logic (our API using admin SDK can bypass rules or you can use Firebase Functions with admin privileges).


Allow reading playbackId and status for viewers if your app is open (or conditionally if stream is public).


Ensure create/delete of streams are properly restricted (e.g., only authenticated users can add a stream doc with their own ownerId).


Example rule snippet (pseudo-code):

 match /streams/{id} {
  allow create: if request.auth != null 
                && request.resource.data.ownerId == request.auth.uid;
  allow update: if request.auth.uid == resource.data.ownerId;
  // Only server (admin) can set muxStreamId/streamKey (could enforce via custom claims or separate logic).
  allow read: if true; // or restrict if streams are meant to be private
}


You might use a Firebase Cloud Function (or the Next API) to create streams so that clients never directly write streamKey themselves, which seems to be the plan here with Next API.


Install Required Packages:


Run the pnpm commands to add dependencies (Mux SDK and Mux Player, etc.) as listed in section 2. Eg:

 pnpm add @mux/mux-node @mux/mux-player-react firebase-admin


If using TypeScript 5 and Next 13+, these should all work out of the box. The Mux packages include their own types. If any linting issues arise (like needing to add "dom" lib for MediaDevice types in tsconfig), adjust the tsconfig.json accordingly (include "DOM" in lib).


Verify the packages installed by checking your package.json.


Implement Mux Service (lib/services/muxService.ts):


Initialize the Mux SDK client:

 import Mux from '@mux/mux-node';
const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!
});
const { Video } = muxClient;  // convenience reference to Video API


Write functions for each needed Mux operation:


createLiveStream: Use Video.LiveStreams.create({...}). Include playback_policy: 'public' so Mux returns a playback ID. Also include new_asset_settings: { playback_policy: 'public' } so that any recorded asset also gets a playback ID. Example:

 export async function createLiveStream(title: string): Promise<{muxStream: LiveStream}> {
  const muxStream = await Video.LiveStreams.create({
    playback_policy: ['public'],
    new_asset_settings: { playback_policy: ['public'] },
    reconnect_window: 60,        // allow 60s reconnect (default 120, adjust if needed)
    latency_mode: 'low',         // or 'reduced' or 'standard', as needed
    test: false                  // set true if you want test mode (5 minute limit)
  });
  return { muxStream };
}
 (The return value can be the Mux live stream object; we’ll extract fields elsewhere.)


getLiveStream: Video.LiveStreams.get(muxStreamId) to retrieve details. (Mux SDK might call it .get or .retrieve depending on version.)


signalLiveStreamComplete: Video.LiveStreams.signalComplete(muxStreamId) to end the stream.


deleteLiveStream: Video.LiveStreams.disable(muxStreamId) (Mux doesn’t truly delete live streams, it disables them so they can’t be used).


Note: In Mux API, "disable" is the term to immediately make a live stream unreusable. We use that for deletion.


verifyWebhookSignature: Implement HMAC SHA256 verification. Mux provides the signature in the mux-signature header (which contains a timestamp and signature). The algorithm (per Mux docs) is: compute sha256(secret + rawBody + timestamp) and compare to provided. You can also use Mux’s SDK if it has a helper. Otherwise:

 import { createHmac } from 'crypto';
export function verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean {
  const [time, sig] = signatureHeader.split(',').map(s => s.split('=')[1]);
  const secret = process.env.MUX_WEBHOOK_SECRET!;
  const hash = createHmac('sha256', secret)
                 .update(time + '.' + rawBody)
                 .digest('hex');
  return hash === sig;
}
 This is a simplified approach. (Be mindful of timing attacks; Mux docs suggest using a secure compare. However, as long as we do exact match, it's usually fine.)


Export these functions. We will use them in the API route handlers. Also decide how to handle errors from Mux (e.g., wrap calls in try/catch and throw custom errors or return error objects).


Test the service functions in isolation (maybe by calling createLiveStream from a temporary script or in the Next.js route directly) to ensure your Mux credentials are working and you can create a stream (especially before wiring up the UI).


Implement API Route Handlers:
 Create the files under app/api/mux/ as described:


In each file, define the corresponding HTTP method functions (export async function GET(req, { params }) {...}, POST, etc., as needed for the route).


Use the muxService functions and Firebase Admin to perform the logic:


POST /api/mux/streams:


Parse and validate body (you can use req.json() to get JSON in Next 13 route handlers). Ensure title is present.


Create live stream via createLiveStream.


Save to Firestore: initialize Firebase Admin (admin.initializeApp() if not done globally) and do admin.firestore().collection('streams').add({...}). Use the returned ref ID as the stream’s id.


Return the stream data as JSON with 201 status. (Next’s route handlers can return NextResponse.json(data, { status: 201 })).


GET /api/mux/streams/[id]:


Fetch Firestore doc by id. (Using admin: admin.firestore().collection('streams').doc(id).get()).


If not found, return 404.


If found, you might optionally call getLiveStream(muxStreamId) to get fresh status. If that returns a status different from Firestore, update Firestore doc (or just include it in response for accuracy).


Return doc data (filter out streamKey if the caller is not owner).


POST /api/mux/streams/[id]/start:


Confirm user owns the stream. Possibly double-check stream status (should be idle).


For external flow: no Mux API call. Maybe just log an action. You could update Firestore status = "starting" if you want immediate feedback. The actual "active" will come via webhook.


For in-app flow: possibly allocate some server-side resources or respond with necessary info. As per our plan, we’ll respond with the stream key and RTMP URL to the client.


Example implementation:

 const doc = await admin.firestore().collection('streams').doc(id).get();
if (!doc.exists) return new NextResponse("Not found", {status:404});
if (doc.data().ownerId !== auth.uid) return new NextResponse("Forbidden", {status:403});
// Firestore update:
await doc.ref.update({ status: 'starting' });
return NextResponse.json({
  message: 'Stream is starting. Please begin streaming using the stream key.',
  streamKey: doc.data().streamKey,
  rtmpUrl: 'rtmps://global-live.mux.com:443/app'
});
 The client can use this info or simply ignore if not needed. Now, the UI should change to indicate "starting..." and then wait for "active".


If implementing Wocket-like internal streaming: you might here initiate a WebSocket server or some handshake. That’s beyond this immediate plan, so we skip it.


POST /api/mux/streams/[id]/stop:


Validate user. Possibly check if stream is currently active (you might allow stop even if active or starting).


Call signalLiveStreamComplete(muxStreamId) using our service. If Mux returns an error (e.g., stream already idle), handle gracefully.


Update Firestore: status = "ended". (Mux’s idle webhook will also come, so you might end up with an extra update; that’s fine or you can rely only on webhook. Doing it here gives immediate feedback.)


Respond 200 JSON { message: 'Stream stopped.' }.


Also, if internal streaming was used, you’d need to inform that process to stop – perhaps via a global WebSocket or a shared mutable flag. Not applicable if external.


DELETE /api/mux/streams/[id]:


Validate user (owner or admin). If active, you may choose to stop it first or disallow deletion.


Call deleteLiveStream(muxStreamId) (a.k.a disable in Mux). No content returned from Mux typically, just a confirmation.


Delete Firestore doc (doc.ref.delete()).


Return 204 No Content (or 200 with message).


POST /api/mux/webhooks:


This one is slightly different due to raw body needed for signature. In Next 13 route handlers, you can use await req.text() to get the raw body (make sure to disable body parsing or use config = { api: { bodyParser: false } } in older Next versions; in App Router it should give raw text if you call .text() first). Then compute verifyWebhookSignature(rawBody, req.headers.get('mux-signature')).


If invalid, return 400.


Parse JSON (you might do JSON.parse(rawBody) manually since you already have the text).


Process each event. Note: Mux might batch events (but usually one at a time). Focus on one event in payload.type.


Use payload.data.id (for live stream events) or relevant field to find the Firestore doc. You might need to query by muxStreamId (create an index on that field if not automatically indexed).


Update the document’s status field (and any other fields like timestamps or asset IDs). For example:

 if (payload.type === 'video.live_stream.active') {
  streamRef.update({ status: 'active', startedAt: admin.firestore.FieldValue.serverTimestamp() });
} else if (payload.type === 'video.live_stream.idle') {
  streamRef.update({ status: 'idle', endedAt: admin.firestore.FieldValue.serverTimestamp() });
} else if (payload.type === 'video.asset.live_stream_completed') {
  streamRef.update({ recordingAssetId: payload.data.id });
}
 Adjust the field names to what you decided (lastAssetId etc.).


End with return NextResponse.json({ received: true }); (which sends 200). Mux doesn’t require a specific body, just a 2xx status, so this is fine.


Testing: Use a tool like curl or Postman to simulate calls:


Test creating a stream via POST /api/mux/streams (after deploying or locally via npm run dev).


You should get a 201 with the JSON. Verify a new Mux live stream is created (check Mux dashboard Live Streams list) and Firestore doc is added.


You can also test the GET and delete endpoints similarly.


Webhook endpoint can be tested by using Mux’s webhook testing or by manually sending a sample payload (with a correct signature generation). Initially, you might skip manual testing of signature and trust small iterative testing.


Once confident, configure the Mux webhook URL to your dev endpoint (if accessible) or use a tunneling service like ngrok to test receiving real webhooks when you actually stream.


Define TypeScript Types:


Create lib/types/stream.ts and add the interfaces/types as described in section 6. This is straightforward coding.


Replace any inline type annotations in your components or API handlers with these types. For example, in the API route, you can cast the Firestore data to Stream or define the expected request body shape as a type.


If using Zod for validation, you could also define a Zod schema for request bodies (e.g., CreateStreamSchema) and then derive a TypeScript type from it. This can be overkill for simple structures, but it’s an option.


Set Up Zustand Stores:


Create useDeviceStore.ts:

 import { create } from 'zustand';
import { MediaDeviceInfo } from '...'; // actually global
interface DeviceState { ... }
interface DeviceActions { ... }
export const useDeviceStore = create<DeviceState & DeviceActions>((set, get) => ({
  cameraDevices: [],
  micDevices: [],
  speakerDevices: [],
  selectedCameraId: null,
  selectedMicId: null,
  selectedSpeakerId: null,
  camPermissionGranted: false,
  micPermissionGranted: false,
  permissionError: null,
  previewStream: null,
  requestPermissions: async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      set({ camPermissionGranted: true, micPermissionGranted: true, permissionError: null });
    } catch (err) {
      set({ permissionError: 'Camera/Mic permission denied' });
    }
  },
  getDevicesList: async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    set({
      cameraDevices: devices.filter(d => d.kind === 'videoinput'),
      micDevices: devices.filter(d => d.kind === 'audioinput'),
      speakerDevices: devices.filter(d => d.kind === 'audiooutput')
    });
  },
  setSelectedCamera: (id) => set({ selectedCameraId: id }),
  setSelectedMic: (id) => set({ selectedMicId: id }),
  setSelectedSpeaker: (id) => set({ selectedSpeakerId: id }),
  createPreviewStream: async () => {
    const { selectedCameraId, selectedMicId } = get();
    if (!selectedCameraId) return;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: selectedCameraId } },
      audio: selectedMicId ? { deviceId: { exact: selectedMicId } } : false
    });
    set({ previewStream: stream });
  },
  stopPreviewStream: () => {
    const { previewStream } = get();
    if (previewStream) {
      previewStream.getTracks().forEach(track => track.stop());
    }
    set({ previewStream: null });
  }
}));
 This is a rough outline; adjust error handling and logic as needed. After creating, test in a component (for example, temporarily call useDeviceStore.getState().requestPermissions() in a dev component to ensure it asks for permissions).


Create useStreamStore.ts similarly:

 import { create } from 'zustand';
import { Stream, StreamStatus } from '@/lib/types/stream';
interface StreamState {
  currentStream: Stream | null;
  isOwner: boolean;
  status: StreamStatus;
  viewerCount: number;
  isStarting: boolean;
  error: string | null;
  // possibly: isStreaming: boolean;
}
interface StreamActions {
  setCurrentStream: (stream: Stream, isOwner: boolean) => void;
  updateStatus: (status: StreamStatus) => void;
  startStream: () => Promise<void>;
  stopStream: () => Promise<void>;
  setError: (msg: string) => void;
}
export const useStreamStore = create<StreamState & StreamActions>((set, get) => ({
  currentStream: null,
  isOwner: false,
  status: 'idle',
  viewerCount: 0,
  isStarting: false,
  error: null,
  setCurrentStream: (stream, isOwner) => set({
    currentStream: stream,
    isOwner,
    status: stream.status || 'idle'
  }),
  updateStatus: (newStatus) => set({ status: newStatus, 
                                    currentStream: get().currentStream ? 
                                                  { ...get().currentStream!, status: newStatus } : null }),
  startStream: async () => {
    const state = get();
    if (!state.currentStream) return;
    set({ isStarting: true, error: null });
    try {
      const res = await fetch(`/api/mux/streams/${state.currentStream.id}/start`, { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      // Optionally, get data:
      const data = await res.json().catch(() => ({}));
      // If external, maybe instruct user now to start OBS using data.streamKey if needed
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isStarting: false });
    }
  },
  stopStream: async () => {
    const state = get();
    if (!state.currentStream) return;
    try {
      await fetch(`/api/mux/streams/${state.currentStream.id}/stop`, { method: 'POST' });
      // We could optimistically update status:
      set({ status: 'idle', currentStream: state.currentStream ? { ...state.currentStream, status: 'idle' } : null });
    } catch (err) {
      console.error('Failed to stop stream', err);
    }
  },
  setError: (msg) => set({ error: msg })
}));
 This store focuses on coordinating with the API. If using Firestore’s real-time updates, you might not need to call updateStatus manually; instead, have a listener that calls it. But if not, you could also poll in the background to check status. Given we have webhooks, the plan is: webhook updates Firestore -> we could use Firestore listener on client to call updateStatus. Alternatively, skip the listener and simply trust that streamer will see their own status transitions by their own actions (Start click sets starting, then they notice when viewer side or some indication says active — but better to implement a listener).


These stores are now ready. They can be imported in components. Test basic usage with a simple component or console logs to ensure they update state as expected.


Build UI Components:


Start with StreamCreateForm:


Create the form UI with appropriate fields. Use state or a form library for the input values. For now, assume just a title field. Example:

 function StreamCreateForm() {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) {
      setError("Title is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/mux/streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      router.push(`/streams/${data.id}`);
    } catch (err) {
      setError("Failed to create stream");
    } finally {
      setLoading(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Stream Title</Label>
        <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter a title" />
      </div>
      {error && <p className="text-red-500">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Stream"}
      </Button>
    </form>
  );
}
 Style with shadcn UI components as necessary.


Integrate this form in the UI: maybe on a page streams/new or in a modal on a dashboard. Ensure that after successful creation, navigation occurs to the new stream page where the user will proceed.


Stream Page (app/streams/[id]/page.tsx):


Implement the server component to fetch the stream data. For example:

 import { Stream } from '@/lib/types/stream';
import { notFound } from 'next/navigation';
import { useStreamStore } from '@/lib/store/useStreamStore';
export default async function StreamPage({ params }) {
  const streamId = params.id;
  // Fetch Firestore doc (could call admin SDK here since this is server component)
  const doc = await admin.firestore().collection('streams').doc(streamId).get();
  if (!doc.exists) return notFound();
  const data = doc.data();
  const stream: Stream = { id: doc.id, ...data } as Stream;
  // Determine if current user is owner (we might get current user ID from cookies or use next-auth in RSC, which is tricky. Alternatively, we mark owner on client side.)
  // For now, just pass the stream data, and handle owner logic in client component via context or by embedding user ID as well.
  return (
    <StreamClientPage stream={stream} />
  );
}
 Because mixing server and client logic can be complex, one approach is to fetch initial data and then use a client component (StreamClientPage) to handle live updates and UI.


In the client component (which has access to stream from props), initialize Zustand store:

 function StreamClientPage({ stream }) {
  const currentUser = useAuthUser(); // pseudo-code: your method of getting logged-in user ID on client
  const isOwner = currentUser?.uid === stream.ownerId;
  const setCurrentStream = useStreamStore(s => s.setCurrentStream);
  useEffect(() => {
    setCurrentStream(stream, isOwner);
    // Subscribe to Firestore updates:
    const unsub = onSnapshot(doc(db, "streams", stream.id), (doc) => {
      const data = doc.data();
      if (data) {
        useStreamStore.getState().updateStatus(data.status);
      }
    });
    return () => { unsub(); }
  }, [stream.id]);
  ...
}
 The above uses Firestore client (if available in your app via db reference) to listen to changes on the stream doc and update Zustand. If you prefer not to use Firestore in client, you could instead use webhooks and some SSE or simply rely on the fact that the streamer knows when they clicked start/stop. However, for viewers, you definitely want real-time updates of status to know when to show video. Firestore’s realtime capability is handy here.


Render UI inside StreamClientPage:


If isOwner, render the StreamControlPanel and below it maybe a small preview or the player. You might decide to hide the actual Mux player for the owner to avoid confusion with delay. Perhaps show a message “You are live” and they can see themselves via the preview from DeviceTester instead of the HLS feed.


If not owner, just render the MuxPlayerWrapper (with playbackId={stream.playbackId}) and maybe the stream title and a <StreamStatusIndicator> above the player. Possibly a refresh or waiting message if offline.


In both cases, include the stream title prominently (maybe as a heading).


If implementing a chat or comments (not in scope, but a likely feature), those would also be included on this page.


DeviceTester:


Implement as described: use useDeviceStore inside to get device lists and actions. On mount, if camPermissionGranted is false, call requestPermissions(). Once granted, call getDevicesList() to populate devices.


Provide UI controls: e.g.,

 const { cameraDevices, micDevices, speakerDevices, selectedCameraId, setSelectedCamera, createPreviewStream, previewStream } = useDeviceStore();
useEffect(() => {
  if (selectedCameraId) {
    createPreviewStream();
    return () => useDeviceStore.getState().stopPreviewStream();
  }
}, [selectedCameraId, selectedMicId]);
...
<select onChange={e => setSelectedCamera(e.target.value)} value={selectedCameraId || ""}>
  {cameraDevices.map(device => <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${device.deviceId}`}</option>)}
</select>
 And similar for mic and speaker.


Render a video element for preview:

 <video ref={videoRef} autoPlay muted className="w-full h-auto bg-black" />
 Then in effect, attach the stream:

 useEffect(() => {
  if (videoRef.current && previewStream) {
    videoRef.current.srcObject = previewStream;
  }
}, [previewStream]);


Layout with appropriate styling. Possibly split into two columns: video preview on one side, settings on the other.


Provide a close button if this is a modal. For modal integration, you might use shadcn's Dialog: the parent (StreamControlPanel) wraps DeviceTester inside <Dialog> components. Alternatively, conditionally render it.


StreamControlPanel:


Use useStreamStore and useDeviceStore:

 const { currentStream, status, startStream, stopStream, isStarting } = useStreamStore();
const { camPermissionGranted } = useDeviceStore();
const [showDevices, setShowDevices] = useState(false);


Display stream info:

 <h3 className="text-xl font-semibold">{currentStream?.title}</h3>
<div className="flex items-center gap-2">
  <StreamStatusIndicator status={status} />
  {status === 'active' && <span className="text-green-600 font-medium">Live</span>}
  {status !== 'active' && <span className="text-gray-600">{status === 'idle' ? 'Offline' : status.charAt(0).toUpperCase()+status.slice(1)}</span>}
</div>
 (If using StreamStatusIndicator fully, it may already output text).


If cam/mic not permitted yet, possibly show a notice: “Please allow camera and microphone to start streaming.”


Button to open DeviceTester dialog:

 <Button variant="secondary" onClick={() => setShowDevices(true)}>Configure Devices</Button>
<Dialog open={showDevices} onOpenChange={setShowDevices}>
  <DialogContent><DeviceTester /></DialogContent>
</Dialog>
 This uses shadcn’s Dialog where DeviceTester is placed inside.


Show stream key & RTMP info for copy:

 <div className="mt-2 text-sm">
  <div>Stream Key: <code>{currentStream?.streamKey}</code> <Button onClick={copyKey}>Copy</Button></div>
  <div>RTMP URL: <code>rtmps://global-live.mux.com:443/app</code> <Button onClick={copyUrl}>Copy</Button></div>
</div>
 (Only display if needed; if the user is expected to use an external encoder. If we fully integrate browser streaming, this might not be necessary.)


Start/Stop buttons:

 { status !== 'active' ? (
    <Button onClick={startStream} disabled={isStarting || !camPermissionGranted}>
      {isStarting ? 'Starting...' : 'Start Stream'}
    </Button>
  ) : (
    <Button onClick={stopStream} variant="destructive">
      Stop Stream
    </Button>
  )
}
 Ensure the Start button is disabled until permissions are granted and device is selected. Possibly also disable if no camera selected.
 After clicking start, if external, instruct user to start their encoder. If internal, maybe show a subtle preview or indication it's streaming.


Error messages: If error in stream store, show it.


If you want, after stream goes live, you could hide some config to not let user accidentally change camera mid-stream (unless you support dynamic switching).


Test the control panel in isolation by simulating different states (set status to active, etc., in the store via devtools or temporary buttons).


MuxPlayerWrapper:


Implement as a simple component:

 import { MuxPlayer } from '@mux/mux-player-react';
import { useStreamStore } from '@/lib/store/useStreamStore';
function MuxPlayerWrapper({ playbackId }) {
  const status = useStreamStore(s => s.status);
  if (status !== 'active') {
    return <div className="text-center text-gray-500">Stream is offline.</div>;
  }
  return (
    <MuxPlayer
      playbackId={playbackId}
      streamType="live"
      controls
      autoPlay
      muted={false}
      style={{ width: '100%', height: 'auto' }}
    />
  );
}
export default MuxPlayerWrapper;
 Here we use Zustand to know if stream is active. For viewers who load the page while stream is offline, this will show "offline" message. Possibly, you could still mount the MuxPlayer even if offline; MuxPlayer would keep attempting to load the HLS manifest (which might 404 until stream is active). But giving a clear message is a better UX. You might enhance this by periodically trying to load once in a while or instruct user to refresh when it’s live. A more advanced approach: poll /api/mux/streams/[id] every X seconds to see if status changed to active (if you can’t use Firestore listeners on a viewer, since viewers might not be allowed to listen if not in security rules; if streams are public, they can).
 If using Firestore and streams are public, you can allow read and use onSnapshot on the stream doc on viewer side too, which gives real-time updates for viewers as well without polling.


You can add an onError prop to MuxPlayer to catch if playback fails (maybe because not live yet) and handle accordingly (like show offline message after initial attempt). And an onPlay to know when it actually starts playing (for analytics or removing a “loading” indicator).


Also consider an aspect ratio wrapper for aesthetics (16:9 area even if no stream).


StreamStatusIndicator:


Simple implementation:

 function StreamStatusIndicator({ status }) {
  let color = 'gray', text = 'Offline';
  if (status === 'active') { color = 'red'; text = 'Live'; }
  else if (status === 'starting') { color = 'orange'; text = 'Starting'; }
  else if (status === 'disconnected') { color = 'orange'; text = 'Reconnecting'; }
  else if (status === 'ended' || status === 'idle') { color = 'gray'; text = 'Offline'; }
  // Choose an icon or colored dot, e.g. using Tailwind for color:
  return <span className="flex items-center gap-1">
    <span className={`inline-block w-2 h-2 rounded-full bg-${color}-500`} />
    <span>{text}</span>
  </span>;
}
 (The color classes would need to exist; with Tailwind JIT it’s fine, but we might need to ensure these classes are in the safelist if dynamically generated.)


This can be styled to fit the design. We can also utilize Radix UI’s Badge with class overrides for colors if desired.


Integrate and Test End-to-End:


Start the development server and walk through the full flow:


Navigate to the stream creation UI. Create a new stream. Ensure a new Firestore doc is made and Mux live stream appears in the Mux dashboard (with status Idle, waiting for broadcast).


You should be redirected to the new stream’s page. As the streamer (owner), the control panel appears. Check that your camera and mic can be accessed via the DeviceTester. Adjust selections and see preview.


Click "Start Stream" in the control panel.


If using an external encoder: At this point, copy the stream key from the UI, paste into OBS or another RTMP app along with the URL, and start streaming from there. (If test mode, remember Mux will cut off after 5 min if you didn’t add credit card).


If using internal (for test, maybe you haven’t fully wired Wocket, so use external for now).


Once you start pushing video to Mux (either via OBS or some means), watch the app:
 The webhook should come in: you’ll get ...connected then ...active. Firestore should update status to "active". Through our Firestore listener in the client, the status in Zustand updates, which:


Triggers the StreamStatusIndicator to turn “Live”.


Triggers the MuxPlayerWrapper (for viewers, or if you open a separate browser as a viewer) to now render the player.
 On the streamer’s own view, since they might not be watching the HLS, you might not visibly see anything new except status. (If we wanted, we could show the MuxPlayer even to owner for verification, but it’s delayed so not super useful to them.)


Open a separate browser (or an incognito window) as a viewer, go to the stream page URL. You should see the stream title and an offline message if you open before it’s live. The status might still be “Offline” until it goes live. When the streamer is live, within a few seconds Firestore will update and the viewer’s app (if it also uses snapshot listener or if they refresh) will show the MuxPlayer. The video should play (with a slight delay inherent to HLS).


Try the Stop Stream button as the streamer. This should call the stop API, which signals Mux to end. The Mux stream will go idle immediately. Mux will send webhooks (live_stream.idle and asset.live_stream_completed). Firestore updates status to idle/ended. The UI should update: status indicator goes offline, player might either stop (MuxPlayer might throw an error or end the video – you might need to handle the end-of-live scenario by maybe showing “Stream ended. You may watch a recording soon.”).


Verify that a recorded asset appeared in Mux dashboard if enabled (it will have the same playbackId for VOD).


If you want, at this point you could automatically keep the player for viewers to watch the replay (since the playbackId remains valid for the video on demand after a short processing time). Mux sends asset.live_stream_completed when the recording is ready, so you know when you can allow viewers to seek/playback the finished video.


Test deletion if applicable by trying to delete a stream from the UI or directly via API (ensuring it’s not live when deleting).


Edge Cases: Test what happens if:


User denies camera permission: DeviceTester should show an error and Start button should remain disabled (because camPermissionGranted false).


Streamer refreshes the page mid-stream: Our app should recover (the Firestore says active; the streamer’s control panel might then show a Stop button ready and status Live because the doc is active and owner can still stop it). Might need logic to allow a streamer to rejoin their own stream in progress. Firestore doc persists the data needed.


Multiple viewers: Open multiple viewer windows to see if the viewer count component (if implemented) updates. If not implemented, consider adding that later via Mux Data or a simple length count of open connections (not trivial without additional infra).


Performance: Ensure that the Mux player loads properly. The @mux/mux-player-react package should handle injecting the needed script for the web component. Check the browser console for any errors related to Mux or media.


Cleanup: When a stream ends, consider resetting some state. For example, when status becomes 'idle' after being 'active', you might want to reset useStreamStore.isStreaming or such. The viewer’s player might still show last frame or an error; you could choose to unmount it and show a message “The live stream has ended.”


Deployment & Webhook Configuration:


Once everything works locally, deploy the Next.js app (e.g., to Vercel). In production, set the env vars (Mux keys, webhook secret, Firebase, etc.).


Update the Mux Dashboard Live Stream webhook endpoint to point to your production URL (https://yourdomain.com/api/mux/webhooks). Ensure the signing secret in env matches what Mux expects.


Do an end-to-end test in production environment: create a stream, start streaming (even a test pattern from OBS), and verify viewers can see it.


Monitor logs for any errors (especially in webhook handling or any CORS issues).


If using test mode streams on Mux (without a credit card), remember they auto-disconnect after 5 minutes. For real usage, enable production by adding credit card and not marking streams as test.


Double-check that no sensitive info is leaked: the stream key should only be visible to owners. The webhooks and API endpoints should be secure.


Future Enhancements (beyond this plan):


Integrate chat (maybe using Firebase or a service like Stream Chat as in the tutorial).


Show viewer count in real-time (Mux Data or a simple solution if using Firebase to track viewers on page).


Allow scheduled streams or saving upcoming stream info.


Improve the in-browser streaming: If you want to remove the need for OBS, consider implementing the Wocket approach: a Node service that accepts video via WebRTC or WebSocket and pushes to Mux. This is complex (requires running ffmpeg on server). It could be a future project once basic integration is stable.


Recording playback page: After a live ends, use the recorded asset’s playbackId (which for us is the same as live playbackId) to let users replay the video. This can be on the same stream page or move to a separate “Past streams” section.


By following these steps, we incrementally build out the Mux live streaming functionality in the CelebFitLife app. The end result will be a fully functional live streaming system: creators can create and start live streams (with Mux handling video ingest and distribution), and viewers can watch the streams with HLS low-latency video. The integration uses Firebase for coordinating data and Mux for heavy lifting of video, combining them to provide a smooth experience.
Finally, ensure to document any new environment variables or setup steps for the team (Mux credentials, etc.), and provide user documentation for the streamers (e.g., how to set up their OBS with the provided stream key, if not using in-browser streaming). With this implementation plan, CelebFitLife can move into live fitness streaming confidently, using Mux’s scalable infrastructure for video delivery. Good luck with the integration!

