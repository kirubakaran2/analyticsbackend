const mongoose = require('mongoose');
const User = require("../Schema/user");

exports.examid = async (req, res) => {
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
                            cond: { $eq: ["$$exam.examid", examObjectId] }
                        }
                    }
                },
            },
            {
                $match: {
                    "exams.examid": examObjectId,
                },
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    username: 1,
                    role: 1,
                    rollno: 1,
                    college: "$college.college",
                    department: "$department.department",
                    year: "$department.year",
                    semester: "$department.semester",
                    section: "$department.section",
                    exams: 1,
                    collegeID: 1,
                    departmentID: 1,
                },
            },
        ]);

        console.log(`Students found: ${students.length}`);

        if (students.length === 0) {
            console.log(`No students found for exam ID: ${examId}`);
        }

        return res.json({ students });

    } catch (err) {
        console.error(`Error occurred: ${err.message}`);
        return res.status(500).json({ status: "Something went wrong" });
    }
};
