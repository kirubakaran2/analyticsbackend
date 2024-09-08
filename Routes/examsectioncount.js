const mongoose = require("mongoose");
const User = require("../Schema/user");

exports.examsid = async (req, res) => {
    try {
        const { examId } = req.params;

        if (!examId) {
            return res.status(400).json({ status: "Exam ID is required" });
        }

        console.log(`Exam ID received: ${examId}`);

        const examObjectId = new mongoose.Types.ObjectId(examId);

        let students = await User.aggregate([
            {
                $addFields: {
                    collegeID: {
                        $toObjectId: "$college",
                    },
                    departmentID: {
                        $toObjectId: "$department",
                    },
                },
            },
            {
                $lookup: {
                    from: "colleges",
                    localField: "collegeID",
                    foreignField: "_id",
                    as: "college",
                },
            },
            {
                $lookup: {
                    from: "departments",
                    localField: "departmentID",
                    foreignField: "_id",
                    as: "department",
                },
            },
            {
                $unwind: "$college",
            },
            {
                $unwind: "$department",
            },
            {
                $lookup: {
                    from: "StudentScores",
                    localField: "_id",
                    foreignField: "studentid",
                    as: "record",
                },
            },
            {
                $unwind: {
                    path: "$record",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    exams: {
                        $filter: {
                            input: "$record.exams",
                            as: "exam",
                            cond: { $eq: ["$$exam.examid", examObjectId] },
                        },
                    },
                },
            },
            {
                $match: {
                    "exams.examid": examObjectId,
                },
            },
            {
                $lookup: {
                    from: "sections", // Replace "sections" with the actual collection name
                    localField: "exams.sections",
                    foreignField: "_id",
                    as: "sectionDetails",
                },
            },
        
            {
                $group: {
                    _id: "$_id",
                    name: { $first: "$name" },
                    username: { $first: "$username" },
                    role: { $first: "$role" },
                    rollno: { $first: "$rollno" },
                    college: { $first: "$college.college" },
                    department: { $first: "$department.department" },
                    year: { $first: "$department.year" },
                    semester: { $first: "$department.semester" },
                    exams: { $first: "$exams" },
                    sectionDetails: { $first: "$sectionDetails" }
                },
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    username: 1,
                    role: 1,
                    rollno: 1,
                    college: 1,
                    department: 1,
                    year: 1,
                    semester: 1,
                    exams: 1,
                    totalPoints: 1,
                    totalObtainedPoints: 1,
                    "sectionDetails._id": 1,
                    "sectionDetails.name": 1,
                },
            },
        ]);

        // Calculate totalPoints and totalObtainedPoints for all users
        let totalPoints = 0;
        let totalObtainedPoints = 0;

        students.forEach(student => {
            totalPoints += student.totalPoints || 0;
            totalObtainedPoints += student.totalObtainedPoints || 0;
        });

        console.log(`Total Points: ${totalPoints}, Total Obtained Points: ${totalObtainedPoints}`);

        return res.json({ 
            students, 
            totalPoints, 
            totalObtainedPoints 
        });
    } catch (err) {
        console.error(`Error occurred: ${err.message}`);
        return res.status(500).json({ status: "Something went wrong" });
    }
};
