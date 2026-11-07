# Architecture
- Use existing Cloud Auth sessions, profiles, and protected user_roles for passwordless entry; project QR links select projects and never confer roles.
- Keep invite URL validation in a shared helper and preserve the invite in the email callback URL so opening mail on another device retains the intended project.