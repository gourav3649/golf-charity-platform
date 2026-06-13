# Golf Charity Platform

A full-stack web application designed to manage charity golf events, track player scores, facilitate donations to various charitable organizations, and handle monthly prize draws. 

## Features

### 🏌️‍♂️ Player & Score Management
- Users can register and log their latest golf scores (using Stableford format, up to 45).
- The platform tracks the history of up to 5 of the most recent scores per user and computes their average score dynamically.

### 🤝 Charities & Donations
- Comprehensive directory of charitable organizations categorized by sector (health, education, environment, etc.).
- Users can make independent donations or set up subscriptions where a configurable percentage of their subscription fee goes to a selected charity.
- Tracks active subscribers and the total amount raised for each charity.

### 🎟️ Monthly Prize Draws
- Automated monthly prize draws (random or algorithmic).
- Participants win prizes based on matching 3, 4, or 5 numbers (from 1-45).
- Integrated prize pool calculation and rollover mechanics for unclaimed jackpots.
- Admin verification and payment tracking for winners.

### 🔐 Authentication & Subscriptions
- Custom authentication built with `bcryptjs` for secure password hashing and JSON Web Tokens (JWT) for session handling.
- Role-based access control (`user` and `admin` roles).
- Subscription history tracking (signup, renewal, upgrades/downgrades, and cancellations).

## Technology Stack

- **Framework:** [Next.js (App Router)](https://nextjs.org/) (v14)
- **Frontend/UI:** React 18, Tailwind CSS, [shadcn/ui](https://ui.shadcn.com/), Lucide React (Icons)
- **Backend/API:** Next.js API Routes (`app/api`)
- **Database:** MongoDB with [Mongoose](https://mongoosejs.com/) ORM
- **Authentication:** Custom JWT + bcryptjs
- **Emails:** `nodemailer` for notifications and transactional emails

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB instance (local or Atlas)

### Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Configure your environment variables. Create a `.env.local` or `.env` file based on `.env.example` with your MongoDB URI, JWT Secret, and SMTP credentials.

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `app/`: Next.js App Router folders defining routes and pages (`(admin)`, `(auth)`, `(dashboard)`, `(public)`).
- `app/api/`: Backend REST API endpoints (charities, donations, draws, scores, subscriptions).
- `components/`: React components including reusable UI elements (`shadcn/ui`).
- `models/`: Mongoose schemas defining the database structure (User, Charity, Donation, Draw, GolfScore).
