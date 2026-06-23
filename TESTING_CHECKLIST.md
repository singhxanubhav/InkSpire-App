# InkSpire Quality Assurance & Manual Testing Checklist

Before deploying any new version to production, perform the following manual test cases.

## Authentication & Onboarding
- [ ] **Register (Success):** Register with valid data -> verify email/OTP (if implemented) -> successful login.
- [ ] **Register (Duplicate):** Register with an existing email -> ensure proper "Already exists" error is displayed (P2002 handled).
- [ ] **Login (Failure):** Login with incorrect password -> ensure generic auth error is displayed.
- [ ] **Password Reset:** Use "Forgot password" -> receive OTP -> reset -> login with new password.
- [ ] **Protected Routes:** Attempt to access a protected screen without auth -> redirected back to login seamlessly.
- [ ] **Token Expiry:** Wait for token expiry (or artificially set it low) -> ensure automatic refresh occurs so user stays logged in without interruption.

## Matching System
- [ ] **Discover Feed:** View discover feed and ensure users load. Test genre and experience level filters.
- [ ] **Send Request:** Send a match request -> verify it appears in "Outgoing Requests".
- [ ] **Receive & Accept:** Log in as the receiver -> verify notification/request appears -> accept -> verify user moves to "Matches" list.
- [ ] **Decline Request:** Decline a request -> verify it is removed from the list.
- [ ] **Unmatch:** Unmatch an existing partner -> verify partner is removed from matches list.

## Idea Exchange (Workspace)
- [ ] **Load Workspace:** Open a match workspace -> verify existing ideas load correctly.
- [ ] **Create Idea:** Create a new idea (e.g., Character type) -> verify it appears instantly in the list.
- [ ] **Edit Idea:** Edit your own idea -> verify changes persist.
- [ ] **Delete Idea:** Delete your own idea -> verify it is removed.
- [ ] **Pin Idea:** Pin an idea -> verify it jumps to the top of the list or visually changes state.
- [ ] **Socket Sync:** Keep two devices open on the same workspace -> create an idea on device A -> verify it appears instantly on device B.

## Writing Prompts
- [ ] **View Prompts:** Verify today's prompt and community prompts load.
- [ ] **Submit Response:** Write a response -> verify word count updates in real-time -> publish response.
- [ ] **Upvote:** Upvote a community prompt -> verify vote count increments and toggles correctly.
- [ ] **Suggest Prompt:** Use the suggest feature -> verify it appears in the pending/suggested list.

## Feedback Module
- [ ] **Submit Excerpt:** Submit an excerpt for feedback -> verify it appears in open requests.
- [ ] **Give Feedback:** Browse open requests -> provide feedback using sliders -> try submitting with empty fields -> verify validation errors.
- [ ] **Receive Feedback:** Log in as owner -> view received feedback -> verify scores and detailed notes display correctly.
- [ ] **Close Request:** Owner closes their own request -> verify status changes to CLOSED.

## Progress & Logging
- [ ] **Log Words:** Log words for the day -> verify daily streak updates and chart shows new bar.
- [ ] **Duplicate Log:** Log words twice in one day -> verify it updates the existing record rather than duplicating it.
- [ ] **Leaderboard:** View the leaderboard -> verify own rank and score are accurately represented.

## Writing Sprints
- [ ] **Browse & Join:** Browse active/upcoming events -> join a sprint.
- [ ] **Sprint Room:** Ensure sprint room loads -> verify countdown timer matches server time.
- [ ] **Update Word Count:** Update word count during sprint -> verify leaderboard reorders based on counts.
- [ ] **End Sprint:** Wait for sprint to end -> verify final result screen is shown.

## Notifications
- [ ] **Receive Push:** Trigger an event (like receiving a match request) -> verify native push notification arrives (background and foreground).
- [ ] **Tap Action:** Tap the notification -> verify app navigates to the correct specific screen.
- [ ] **Mark Read:** View notification list -> mark all as read -> verify badge clears.

## Edge Cases & Resiliency
- [ ] **Offline Mode:** Open app with no internet -> verify offline banner shows, cached content is displayed instead of crashing.
- [ ] **Reconnect:** Re-enable internet -> verify content refreshes automatically.
- [ ] **Sprint Interruption:** Force close app mid-sprint -> reopen and rejoin sprint -> verify previous word count is preserved.
- [ ] **Form Validation:** Submit forms (Profile Edit, Give Feedback, etc.) with empty required fields -> verify all validation errors show clearly.
- [ ] **Text Overflow:** Input extremely long text strings into inputs and titles -> verify UI truncates or wraps correctly without breaking layout.
