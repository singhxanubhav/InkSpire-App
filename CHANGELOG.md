# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - Production Launch Release

### Added
- **Authentication:** Complete JWT-based auth flow including login, registration, and automatic token refresh.
- **Matchmaking System:** Intelligent writer matching based on genre, experience, and availability. Includes swipeable Discover feed.
- **Collaborative Workspaces:** Real-time socket-based idea exchange for matched writers, organized by Character, Plot, World, and Dialogue pillars.
- **Writing Prompts:** Daily and community-driven writing prompts with real-time word counting and publishing capabilities.
- **Feedback Engine:** Structured excerpt submission and review system utilizing rubric sliders (Clarity, Pacing, etc.) and detailed critique notes.
- **Progress Tracking:** Daily word count logging, streak tracking, data visualization charts, and global leaderboards.
- **Writing Sprints:** Live, synchronized writing sprints for competitive and collaborative productivity.
- **Notifications:** Push notifications via Expo for match requests, sprint events, and feedback.
- **Premium UI:** Bespoke design system utilizing `NativeWind`, gesture-driven navigation, bottom sheets, and haptic feedback.
- **Global Error Handling:** Robust Prisma error mappings (P2002, P2025) and unhandled rejection fallbacks on the Express server.
- **Production Scripts:** Seed scripts for database initialization, environment variable validations, and detailed Postman collections.

### Changed
- Standardized modal navigation across the mobile app to utilize swipe-down gestures instead of legacy cross buttons.
- Replaced native system alerts (`Alert.alert`) with a cohesive, animated custom `ConfirmModal` component with haptic integration.

### Fixed
- Addressed Android UI overlapping issues where bottom sheets were occluded by the navigation bar by integrating `useSafeAreaInsets` and `statusBarTranslucent`.
- Resolved JSX rendering single-root errors across the Feedback and Prompt modules.
- Added comprehensive try/catch blocks across all Express service controllers.
