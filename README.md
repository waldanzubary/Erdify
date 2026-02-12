# ERDify Studio — Free ERD Generator with Real-Time Collaboration

[![Live Demo](https://img.shields.io/badge/Live%20Demo-erdify.my.id-blue?style=for-the-badge)](https://www.erdify.my.id)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org)

**Transform SQL to ER diagrams instantly** with our free online ERD collaboration tool. Design, visualize, and export database schemas with real-time team collaboration.

🌐 **Live Demo:** [www.erdify.my.id](https://www.erdify.my.id)

---

## ✨ Feature

### 🎯 Core Features
- **Free ERD Generator** — Upload SQL files and generate diagrams instantly
- **SQL to ERD Conversion** — Automatic constraint detection and data type identification
- **Real-Time Collaboration** — Live cursors, instant schema synchronization, and team project sharing
- **Drag-and-Drop Relationships** — Create relationships by dragging connections between columns
- **Interactive Sticky Notes** — Add notes, toggle status (Todo/Working on/Done) directly on canvas
- **Auto Layout** — Powered by Dagre algorithm for optimal diagram organization

### 🚀 Export & Sharing
- **Transparent PNG Export** — Clean, presentation-ready diagrams with auto-hidden UI elements
- **JSON Export** — Export your schema for backup or integration
- **Project Sharing** — Collaborate with your team using role-based access (View/Edit)

### 🎨 Design
- **Noir Theme** — Clean, professional white/neutral palette
- **Glassmorphism UI** — Modern, premium interface design
- **Responsive Layout** — Perfect on desktop and mobile devices

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React, TypeScript
- **UI Libraries:** React Flow, Framer Motion, Lucide Icons
- **Backend:** Supabase (Authentication, Database, Realtime)
- **Database:** PostgreSQL with Drizzle ORM
- **Parsing:** Custom SQL Parser
- **Layout Algorithm:** Dagre
- **Deployment:** Vercel

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- Supabase account (for backend services)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/erdify-studio.git
   cd erdify-studio
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   DATABASE_URL=your_database_connection_string
   ```

4. **Run database migrations**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📖 Usage

1. **Sign up** for a free account at [www.erdify.my.id](https://www.erdify.my.id)
2. **Upload your SQL file** or start with a blank canvas
3. **Design your ERD** using drag-and-drop relationships
4. **Collaborate** in real-time with your team
5. **Export** to PNG or JSON when ready

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🌟 Support

If you find ERDify Studio helpful, please give it a ⭐ on GitHub!

**Live Demo:** [www.erdify.my.id](https://www.erdify.my.id)

---

## 📧 Contact

- **Website:** [www.erdify.my.id](https://www.erdify.my.id)
- **GitHub:** [@yourusername](https://github.com/yourusername)
- **Twitter:** [@erdifystudio](https://twitter.com/erdifystudio)

---

Built with ❤️ by the ERDify Studio team
