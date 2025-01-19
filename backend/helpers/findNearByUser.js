const User = require('../models/User');
const moment = require('moment');

async function findNearbyUsers(latitude, longitude, maxDistanceInMeters, page = 1, limit = 10, filters = {}) {
    try {
        const skip = (page - 1) * limit; // Calculate the number of documents to skip

        // Base aggregation pipeline
        const pipeline = [];

        // Add $geoNear stage if latitude, longitude, and maxDistanceInMeters are provided
        if (latitude && longitude && maxDistanceInMeters) {
            pipeline.push({
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: [longitude, latitude], // [longitude, latitude]
                    },
                    distanceField: 'distance', // Add a field to store the calculated distance
                    maxDistance: maxDistanceInMeters, // Radius in meters
                    spherical: true, // Use spherical geometry for accurate distance calculations
                },
            });
        }

        // Add $match stage for gender filter if provided
        if (filters.gender) {
            pipeline.push({
                $match: {
                    gender: filters.gender, // Assuming the User schema has a 'gender' field
                },
            });
        }

        // Add $match stage for age filter if provided
        if (filters.age && filters.age.min && filters.age.max) {
            const currentDate = moment(); // Current date
            const minBirthDate = currentDate.clone().subtract(filters.age.max, 'years').toDate(); // Oldest birth date (youngest age)
            const maxBirthDate = currentDate.clone().subtract(filters.age.min, 'years').toDate(); // Youngest birth date (oldest age)

            pipeline.push({
                $match: {
                    dateOfBirth: {
                        $gte: minBirthDate, // Users born after this date (younger than max age)
                        $lte: maxBirthDate, // Users born before this date (older than min age)
                    },
                },
            });
        }

        // Add $skip and $limit stages for pagination
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });

        // Execute the aggregation pipeline
        const users = await User.aggregate(pipeline);

        // Get the total count of users (for pagination metadata)
        const totalCount = await User.countDocuments(pipeline[0]?.$geoNear ? { location: { $exists: true } } : {});

        // Calculate total pages
        const totalPages = Math.ceil(totalCount / limit);

        return {
            users,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        };
    } catch (error) {
        console.error('Error finding users:', error);
        throw error;
    }
}

module.exports = findNearbyUsers;