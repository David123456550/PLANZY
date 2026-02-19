import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/planzy";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectToDatabase() {
  // Limpiar caché en desarrollo para evitar problemas
  if (process.env.NODE_ENV === "development") {
    // No usar caché en desarrollo para evitar problemas con datos obsoletos
  }
  
  if (cached.conn) {
    console.log("📦 Usando conexión en caché a MongoDB");
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log(`🔌 Conectando a MongoDB: ${MONGODB_URI}`);
    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log("✅ Conectado a MongoDB exitosamente");
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("❌ Error conectando a MongoDB:", e);
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
