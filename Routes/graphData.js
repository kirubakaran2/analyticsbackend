const Performance = require("../Schema/performance");
const Exam = require("../Schema/events");

const getGraphData = async (studentId) => {
    const performance = await Performance.find({ studentid: studentId });
    let numberOfMcq = 0;
    let numberOfCod = 0;
    let numberOfBot = 0;
    let overallPoints = 0;
    let points = 0;
    const OverAllPerf = [];

    const addedExamIds = new Set(); 

    for (let perf of performance) {
        // Increment counters based on performance category
        if (perf.category === 'mcq') {
            numberOfMcq++;
        } else if (perf.category === 'coding') {
            numberOfCod++;
        } else if (perf.category === 'both') {
            numberOfBot++;
        }

        // Accumulate obtained points
        points += perf.obtainpoint;

        // Fetch the exam details
        const exam = await Exam.findOne({ _id: perf.examid });
        if (!exam) {
            console.error(`Exam not found for exam ID: ${perf.examid}`);
            continue;
        }

        // Accumulate overall rating points from the exam
        overallPoints += exam.overallRating;

        // Check if examId is already added
        if (!addedExamIds.has(exam._id.toString())) {
            OverAllPerf.push({
                examId: exam._id,
                examName: exam.title,
                obtainpoint: perf.obtainpoint
            });
            addedExamIds.add(exam._id.toString()); // Add examId to set
        }
    }

    const totalCount = addedExamIds.size;

    // Return calculated metrics
    return {
        numberOfMcq,
        numberOfCod,
        numberOfBot,
        overallPoints,
        points,
        OverAllPerf,
        totalCount
    };
};

module.exports = { getGraphData };
