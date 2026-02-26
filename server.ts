import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const db = new Database("database.db");
db.pragma("foreign_keys = ON");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    full_name TEXT,
    is_admin INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    specialty TEXT,
    phone TEXT,
    experience INTEGER
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    doctor_id INTEGER,
    date TEXT,
    notes TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(doctor_id) REFERENCES doctors(id)
  );

  CREATE TABLE IF NOT EXISTS meds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    dosage TEXT,
    frequency TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS symptoms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    description TEXT,
    severity TEXT,
    date TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Migrations: Ensure columns exist if table was created earlier
try { db.prepare("ALTER TABLE users ADD COLUMN full_name TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0").run(); } catch (e) {}

// Log table info for debugging
console.log("Users table info:", db.prepare("PRAGMA table_info(users)").all());

// Seed doctors if empty
const doctorCount = db.prepare("SELECT COUNT(*) as count FROM doctors").get() as { count: number };
if (doctorCount.count === 0) {
  const insert = db.prepare("INSERT INTO doctors (name, specialty, phone, experience) VALUES (?, ?, ?, ?)");
  insert.run("Dr. Alisher Karimov", "Terapevt", "+998 90 123 45 67", 10);
  insert.run("Dr. Nigora Ahmedova", "Kardiolog", "+998 91 234 56 78", 15);
  insert.run("Dr. Jamshid Ergashev", "Nevrolog", "+998 93 345 67 89", 8);
}

// Seed admin user
const ensureAdmin = () => {
  const admin = db.prepare("SELECT id FROM users WHERE email = ?").get("admin@medcare.uz") as { id: number } | undefined;
  if (admin) {
    db.prepare("UPDATE users SET is_admin = 1, password = ? WHERE id = ?").run("admin123", admin.id);
  } else {
    db.prepare("INSERT INTO users (email, password, full_name, is_admin) VALUES (?, ?, ?, ?)").run("admin@medcare.uz", "admin123", "Tizim Administratori", 1);
  }
  console.log("Admin account ensured: admin@medcare.uz / admin123");
};
ensureAdmin();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Routes
  app.post("/api/auth/register", (req, res) => {
    console.log("Registration request body:", req.body);
    const { email, password, fullName } = req.body;
    try {
      const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
      const isAdmin = userCount.count === 0 ? 1 : 0;
      const info = db.prepare("INSERT INTO users (email, password, full_name, is_admin) VALUES (?, ?, ?, ?)").run(email, password, fullName, isAdmin);
      res.json({ id: info.lastInsertRowid, email, full_name: fullName, is_admin: isAdmin });
    } catch (e) {
      console.error("Registration error:", e);
      res.status(400).json({ error: "Email allaqachon mavjud yoki ma'lumotlar noto'g'ri" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT id, email, full_name, is_admin FROM users WHERE email = ? AND password = ?").get(email, password) as any;
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Email yoki parol noto'g'ri" });
    }
  });

  // Profile Update
  app.post("/api/auth/update", (req, res) => {
    const { id, email, password, fullName } = req.body;
    try {
      if (password) {
        db.prepare("UPDATE users SET email = ?, password = ?, full_name = ? WHERE id = ?").run(email, password, fullName, id);
      } else {
        db.prepare("UPDATE users SET email = ?, full_name = ? WHERE id = ?").run(email, fullName, id);
      }
      const user = db.prepare("SELECT id, email, full_name, is_admin FROM users WHERE id = ?").get(id);
      res.json(user);
    } catch (e) {
      res.status(400).json({ error: "Email allaqachon mavjud yoki xatolik yuz berdi" });
    }
  });

  // Doctors
  app.get("/api/doctors", (req, res) => {
    const doctors = db.prepare("SELECT * FROM doctors").all();
    res.json(doctors);
  });

  // Appointments
  app.get("/api/appointments/:userId", (req, res) => {
    const appointments = db.prepare(`
      SELECT a.*, d.name as doctor_name, d.specialty as doctor_specialty 
      FROM appointments a 
      JOIN doctors d ON a.doctor_id = d.id 
      WHERE a.user_id = ?
    `).all(req.params.userId);
    res.json(appointments);
  });

  app.post("/api/appointments", (req, res) => {
    const { userId, doctorId, date, notes } = req.body;
    const info = db.prepare("INSERT INTO appointments (user_id, doctor_id, date, notes) VALUES (?, ?, ?, ?)").run(userId, doctorId, date, notes);
    res.json({ id: info.lastInsertRowid });
  });

  // Meds
  app.get("/api/meds/:userId", (req, res) => {
    const meds = db.prepare("SELECT * FROM meds WHERE user_id = ?").all(req.params.userId);
    res.json(meds);
  });

  app.post("/api/meds", (req, res) => {
    const { userId, name, dosage, frequency } = req.body;
    const info = db.prepare("INSERT INTO meds (user_id, name, dosage, frequency) VALUES (?, ?, ?, ?)").run(userId, name, dosage, frequency);
    res.json({ id: info.lastInsertRowid });
  });

  // Symptoms
  app.get("/api/symptoms/:userId", (req, res) => {
    const symptoms = db.prepare("SELECT * FROM symptoms WHERE user_id = ? ORDER BY date DESC").all(req.params.userId);
    res.json(symptoms);
  });

  app.post("/api/symptoms", (req, res) => {
    const { userId, description, severity, date } = req.body;
    const info = db.prepare("INSERT INTO symptoms (user_id, description, severity, date) VALUES (?, ?, ?, ?)").run(userId, description, severity, date);
    res.json({ id: info.lastInsertRowid });
  });

  // Admin Endpoints
  app.get("/api/admin/stats", (req, res) => {
    const users = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
    const appointments = db.prepare("SELECT COUNT(*) as count FROM appointments").get() as any;
    const doctors = db.prepare("SELECT COUNT(*) as count FROM doctors").get() as any;
    res.json({ users: users.count, appointments: appointments.count, doctors: doctors.count });
  });

  app.get("/api/admin/appointments", (req, res) => {
    const appointments = db.prepare(`
      SELECT a.*, d.name as doctor_name, u.full_name as user_name, u.email as user_email
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON a.user_id = u.id
      ORDER BY a.date DESC
    `).all();
    res.json(appointments);
  });

  app.post("/api/admin/doctors", (req, res) => {
    const { name, specialty, phone, experience } = req.body;
    const info = db.prepare("INSERT INTO doctors (name, specialty, phone, experience) VALUES (?, ?, ?, ?)").run(name, specialty, phone, experience);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/admin/doctors/:id", (req, res) => {
    const { id } = req.params;
    try {
      const deleteAppointments = db.prepare("DELETE FROM appointments WHERE doctor_id = ?");
      const deleteDoctor = db.prepare("DELETE FROM doctors WHERE id = ?");
      
      const transaction = db.transaction(() => {
        deleteAppointments.run(id);
        deleteDoctor.run(id);
      });
      
      transaction();
      res.json({ success: true });
    } catch (e) {
      console.error("Delete doctor error:", e);
      res.status(500).json({ error: "Shifokorni o'chirishda xatolik yuz berdi" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
