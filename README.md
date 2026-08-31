# Balance AI Companion

Act as a Principal Product Designer & Senior Frontend Engineer specializing in accessible, modern mobile app interfaces. 

Design a high-fidelity mobile application interface (UI/UX) for a student productivity and burnout prevention app called "BalanceAI" under the "Lifestyle Track: Beating the Burnout - Stress & Workload Manager" prompt.

---

### 🎨 DESIGN SYSTEM & AESTHETIC REQUIREMENTS

1. Visual Style:

   - Modern, cool aesthetic featuring subtle GLASSMORPHISM (frosted glass cards, translucent blurs `backdrop-filter: blur(16px)`, soft outer glows, crisp neon/pastel accents).

   - Clean, decluttered typography (Sans-serif like Inter or SF Pro) with distinct hierarchy.

   - Smooth corner radiuses (rounded edges `24px` for cards, `16px` for buttons) to give a friendly, approachable feel.

2. Theme Toggle & Palette:

   - Light Mode: Clean off-white background (#F8F9FA), translucent white frosted cards, vibrant soft gradient accents (violet, teal, warm rose).

   - Dark Mode: Rich deep slate/navy background (#0F172A), dark translucent frosted cards (#1E293B with low opacity), glowing subtle neon accents.

   - Light / Dark Mode Toggle Switch prominently placed in the app header or sticky navigation bar.

3. Neurodiversity & Accessibility Customization (ADHD & Mild Autism Friendly):

   - The UI MUST adapt dynamically based on a user preference chosen in the Profile Settings:

     * Normal / Standard Mode: Balanced visuals, ambient animations, full visual feedback.

     * ADHD Mode: Minimizes task paralysis using micro-step break downs, high contrast action triggers, dopamine micro-rewards, and reduced screen clutter.

     * Mild Autism Mode: Low sensory stimulation palette (muted pastel colors, zero flashing or sudden animations), clear structured layout, predictable navigation, clear text labels over ambiguous icons.

4. Future-Proof Scalability:

   - Use a universal 5-slot bottom navigation bar:

     1. Home / Companion (Active)

     2. Workload / Balancer

     3. [ + ] Quick Action Floating Button (Center)

     4. Insights / Metrics (Reserved for future features)

     5. Profile & Settings

---

### 📱 DETAILED SCREEN BREAKDOWN TO GENERATE

#### SCREEN 1: Main Dashboard (Symbiotic AI Companion & 5-Vector Overview)

- Header: User greeting ("Hey, Dhanesh 👋"), Light/Dark Mode toggle switch, and current overall status pill ("88% Capacity - High Load").

- Symbiotic AI Companion Centerpiece:

  - An interactive, animated avatar container with a glassmorphic frame.

  - Avatar state visually reflects burnout (e.g., slumped posture, surrounded by subtle clutter when capacity > 85%, smiling/vibrant when balanced).

  - A natural speech bubble or conversational prompt bar directly underneath: "I noticed your workload is heavy today. Want me to rebalance your calendar?"

- 5-Vector Capacity Overview Card:

  - Visual gauge/progress bars split into 5 categories: Mental (90%), Time (85%), Physical (40%), Social (75%), Errands (30%).

  - Clean percentages and visual color indicators (Green = Safe, Amber = Warning, Red = Overloaded).

#### SCREEN 2: Autonomous Workload Balancer (Intervention Modal / Screen at 85%+ Load)

- Triggers when Capacity > 85%:

  - Header: "Capacity Shield Activated (88% Load Detected)".

  - Offloaded Tasks Card Container: Displays grouped non-urgent tasks (e.g., "Grocery Shopping", "Club Prep") with auto-suggested rescheduled dates (e.g., "Deferred to Saturday").

  - Auto-Decline Draft Drawer:

    - Pre-generated, polite text response preview: *"Hey! I'm completely at capacity with exams this week, so I won't be able to make it to tonight's dinner. Let's reconnect next week!"*

  - Action Controls: "Approve & Rebalance (1-Tap)" primary button (glowing glass gradient) and "Customize" secondary button.

#### SCREEN 3: Comprehensive Profile & Neurodiversity Settings

- Top User Profile Card (Standard App Credentials):

  - User Photo/Avatar, Full Name ("Dhanesh Kumar"), University ("Tech University - Year 3 CS"), Student Email & Connected Calendar status indicator ("Google Calendar Synced 🟢").

- Accessibility & Neurodiversity Preferences (CRITICAL FEATURE):

  - A segmented radio button or toggle selector for Interface Mode:

    [ Normal ]  |  [ ADHD Mode ]  |  [ Mild Autism Mode ]

  - Subtle micro-copy under each option explaining how the UI adapts (e.g., "ADHD Mode: Reduces task paralysis with micro-actions. Autism Mode: Muted colors & predictable layouts.").

- Capacity Baseline Sliders:

  - Sliders to adjust personal limits for Mental, Physical, Social, Time, and Errands load tolerance.

- App Preferences:

  - Dark / Light Mode main toggle.

  - Notification controls (e.g., "Allow Proactive Recovery Nudges").

---

### 💡 OUTPUT FORMAT

Generate a complete, modern, responsive HTML/Tailwind CSS or React code structure (or visual wireframe components) with clean glassmorphic CSS styles (`backdrop-blur`, borders with low-opacity white/black, soft drop shadows), dark/light mode state management, and clear UI component sections.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5adad6c2-83d7-4123-ac20-678abbd298c2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
