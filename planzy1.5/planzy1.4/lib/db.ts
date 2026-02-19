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
  // En desarrollo, forzar reconexión para evitar caché obsoleto
  if (process.env.NODE_ENV === "development" && cached.conn) {
    console.log("🔄 Limpiando caché de conexión en desarrollo...");
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    if (global.mongoose) {
      global.mongoose.conn = null;
      global.mongoose.promise = null;
    }
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
      console.log(`📊 Base de datos: ${mongoose.connection.db?.databaseName}`);
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
