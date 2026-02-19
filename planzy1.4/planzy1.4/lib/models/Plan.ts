import mongoose, { Schema, model, models } from 'mongoose';

const PlanSchema = new Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: String,
    category: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    location: {
        name: String,
        address: String,
        lat: Number,
        lng: Number,
        city: String
    },
    maxParticipants: Number,
    currentParticipants: { type: Number, default: 0 },
    pricePerPerson: Number,
    minAge: Number,
    courtReservation: {
        courtName: String,
        reservationTime: String,
        price: Number
    },
    // We store the full user object in the plan for now to match the existing Type structure,
    // but in a real relational DB we might just store the ID.
    // For MongoDB, embedding or referencing works. Let's reference by ID but population is needed.
    // To keep it simple and match the frontend Types EXACTLY without huge refactors:
    // We will store the Creator ID and query it, or store a simplified object.
    // However, the frontend expects `creator: User`.
    // Let's store the raw object for 'participants' and 'creator' to minimize friction for now,
    // or use deep population. Storing object is easier for "Migrate EVERYTHING to Mongo" request speed.
    creator: { type: Object, required: true },
    participants: [{ type: Object }], // Array of User objects
    createdAt: { type: Date, default: Date.now }
});

export const Plan = models.Plan || model('Plan', PlanSchema);
