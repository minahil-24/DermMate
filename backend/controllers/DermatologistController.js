const DermatologistProfile = require('../models/DermatologistProfile');
const fs = require('fs');
const path = require('path');

// Create profile
exports.createProfile = async (req, res) => {
    try {
        const { userId, fullName, specialty, yearsOfExperience, qualifications, clinicName, clinicAddress, city, phone, bio, consultationFee, availability } = req.body;

        // Check if profile already exists for this user
        const existingProfile = await DermatologistProfile.findOne({ userId });
        if (existingProfile) {
            return res.status(400).json({ message: "Profile already exists for this user." });
        }

        const profilePhoto = req.files && req.files['profilePhoto'] ? req.files['profilePhoto'][0].path : null;
        const certifications = req.files && req.files['certifications'] ? req.files['certifications'].map(file => file.path) : [];

        const newProfile = new DermatologistProfile({
            userId,
            fullName,
            specialty,
            yearsOfExperience,
            qualifications,
            clinicName,
            clinicAddress,
            city,
            phone,
            bio,
            consultationFee,
            availability,
            profilePhoto,
            certifications
        });

        await newProfile.save();
        res.status(201).json(newProfile);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get all profiles
exports.getProfiles = async (req, res) => {
    try {
        const profiles = await DermatologistProfile.find().populate('userId', 'email');
        res.status(200).json(profiles);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Search profiles with multi-filters
exports.searchProfiles = async (req, res) => {
    try {
        const { name, city, specialty, keyword } = req.query;
        let query = {};

        if (name) {
            query.fullName = { $regex: name, $options: 'i' };
        }
        if (city) {
            query.city = { $regex: city, $options: 'i' };
        }
        if (specialty) {
            query.specialty = { $regex: specialty, $options: 'i' };
        }
        if (keyword) {
            query.$or = [
                { bio: { $regex: keyword, $options: 'i' } },
                { clinicName: { $regex: keyword, $options: 'i' } },
                { qualifications: { $regex: keyword, $options: 'i' } }
            ];
        }

        const profiles = await DermatologistProfile.find(query).populate('userId', 'email');
        res.status(200).json(profiles);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get single profile
exports.getProfileById = async (req, res) => {
    try {
        const profile = await DermatologistProfile.findById(req.params.id).populate('userId', 'email');
        if (!profile) return res.status(404).json({ message: "Profile not found" });
        res.status(200).json(profile);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update profile
exports.updateProfile = async (req, res) => {
    try {
        const profileId = req.params.id;
        let profile = await DermatologistProfile.findById(profileId);
        if (!profile) return res.status(404).json({ message: "Profile not found" });

        // Authorization check: only the doctor who owns the profile can update it
        if (profile.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Not authorized to update this profile" });
        }

        const updateData = { ...req.body };

        if (req.files && req.files['profilePhoto']) {
            // Delete old photo
            if (profile.profilePhoto && fs.existsSync(profile.profilePhoto)) {
                fs.unlinkSync(profile.profilePhoto);
            }
            updateData.profilePhoto = req.files['profilePhoto'][0].path;
        }

        if (req.files && req.files['certifications']) {
            // Option: delete old certifications if we're replacing them all, or just append. 
            // The requirement says "allow updating uploaded files", usually means replacement or addition.
            // For simplicity, let's replace them if new ones are provided.
            profile.certifications.forEach(cert => {
                if (fs.existsSync(cert)) fs.unlinkSync(cert);
            });
            updateData.certifications = req.files['certifications'].map(file => file.path);
        }

        const updatedProfile = await DermatologistProfile.findByIdAndUpdate(profileId, updateData, { new: true });
        res.status(200).json(updatedProfile);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete profile
exports.deleteProfile = async (req, res) => {
    try {
        const profile = await DermatologistProfile.findById(req.params.id);
        if (!profile) return res.status(404).json({ message: "Profile not found" });

        // Authorization check
        if (profile.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Not authorized to delete this profile" });
        }

        // Delete files from server
        if (profile.profilePhoto && fs.existsSync(profile.profilePhoto)) {
            fs.unlinkSync(profile.profilePhoto);
        }
        profile.certifications.forEach(cert => {
            if (fs.existsSync(cert)) fs.unlinkSync(cert);
        });

        await DermatologistProfile.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Profile and files deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
