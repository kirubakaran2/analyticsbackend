const Meet = require("../Schema/meeting");
const SuperAdmin = require("../Schema/superadmin")
const User = require("../Schema/user")
const Student = require('../Schema/user');
const Admin = require("../Schema/admin")
const College = require("../Schema/college")
const Department = require("../Schema/department")
const jwt = require("jsonwebtoken")
const secret = process.env.secret || "SuperK3y"
const Exam = require("../Schema/events")
const Section = require("../Schema/sections")
const Performance = require("../Schema/performance")
const Rank = require("../Schema/ranking")
const ScoreBoard = require("../Schema/scoreboard")
const Scoring = require("../Schema/scores")
const { getGraphData } = require('../Routes/graphData')
const Event = require("../Schema/techevent")

async function profileID(token) {
    var tok = token.headers.authorization;
    tok = tok.substring(7);
    var id;
    try {
        id = await jwt.verify(tok, secret);
    }
    catch(err) {
        id = null;
    }
    const user = await User.findOne({_id:id.id});
    if(user) {
        return user;
    }
    else {
        const superadmin = await SuperAdmin.findOne({_id:id.id});
        if(superadmin) {
            return superadmin
        }
        else {
            const admin = await Admin.findOne({_id:id.id});
            if(admin) {
                return admin
            }
            else null;
        }
    }
}

exports.superadminext = async (req, res) => {
    try {
        const user = await profileID(req);

        // Print user college for debugging
        // console.log('User College:', user.college);
        const exams = await Exam.find({ college: user.college }).limit(5);
        const events = await Event.find({}).limit(5);
        const scores = await ScoreBoard.find({ college: user.college }).sort({ scores: -1 }).limit(5);
        // console.log('Fetched Exams:', exams);
        const examCount = await Exam.countDocuments({ college: user.college });
        const eventCount = await Event.countDocuments({});
        const studentCount = await User.countDocuments({ college: user.college, role: 'student' });
        const totalScoreResult = await ScoreBoard.aggregate([
            { $match: { college: user.college } },
            { $group: { _id: null, totalScore: { $sum: "$scores" } } }
        ]);

        const totalScore = totalScoreResult.length ? totalScoreResult[0].totalScore : 0; // Handle empty result

        return res.json({
            exams,
            events,
            scores,
            examCount,
            eventCount,
            studentCount,
            totalScore
        });
    } catch (err) {
        console.error('Error fetching data:', err);
        return res.status(500).json({ message: 'Something went wrong', error: err.message });
    }
};
