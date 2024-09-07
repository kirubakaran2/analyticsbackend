const User = require("../Schema/user");
const SuperAdmin = require("../Schema/superadmin");
const Admin = require("../Schema/admin");
const Event = require("../Schema/events"); 

exports.count = async (req, res) => {
    try {
        const result = {
            superadmin: 0,
            admin: 0,
            student: 0,
            exams: 0,
            monthlyExamCounts: {}
        };

        const studentCount = await User.countDocuments({ role: 'student' });
        result.student = studentCount;

        const superadminCount = await SuperAdmin.countDocuments({});
        result.superadmin = superadminCount;

        const adminCount = await Admin.countDocuments({});
        result.admin = adminCount;

        const examCount = await Event.countDocuments({});
        result.exams = examCount;

        const monthlyCounts = await Event.aggregate([
            {
                $project: {
                    month: { $month: "$start" },
                    year: { $year: "$start" }
                }
            },
            {
                $group: {
                    _id: { year: "$year", month: "$month" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        ]);

        monthlyCounts.forEach(({ _id, count }) => {
            const monthKey = `${_id.year}-${_id.month.toString().padStart(2, '0')}`;
            result.monthlyExamCounts[monthKey] = count;
        });

        return res.json(result);

    } catch (err) {
        console.error("Error fetching counts:", err);
        return res.status(500).json({ status: "Something went wrong", error: err.message });
    }
};
