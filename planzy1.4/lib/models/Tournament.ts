import mongoose, { Schema, model, models } from 'mongoose';

const TournamentTeamSchema = new Schema({
    id: { type: String, required: true },
    name: String,
    color: String,
    players: [Object] // Array of User objects
});

const TournamentSchema = new Schema({
    id: { type: String, required: true, unique: true },
    planId: { type: String, required: true },
    sport: String,
    playersPerTeam: Number,
    teams: [TournamentTeamSchema],
    createdAt: { type: Date, default: Date.now }
});

export const Tournament = models.Tournament || model('Tournament', TournamentSchema);
