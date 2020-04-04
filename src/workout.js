var app = angular.module("WorkoutApp", []);

function getTimeMilliseconds() {
    let date = new Date();
    return date.getTime();
}

function millisecondsToMinSeconds(ms) {
    let ms_round = 1000*Math.round(ms/1000); // round to nearest second
    let d = new Date(ms_round);
    return d.getUTCMinutes() + ':' + d.getUTCSeconds(); // "4:59"
}

app.controller('WorkoutController', function($http) {

    var workout = this;

    workout.started = false;
    workout.saved = false;

    // TODO Use these later
    workout.equipment = {
        "thick bar": 25,
        "ez curl bar": 15,
        "bench bar": 45
    }

    workout.data = {
        "routines": [

        ]
    }

    var workout_link = "https://www.clickthisnick.com/workout-tracker/src/workouts"

    $http.get(`${workout_link}/active.json`).success(function (active_workouts){
        active_workouts['workouts'].forEach((workout_file) => {
            // To get around cors locally.. load from github
            $http.get(`${workout_link}/${workout_file}`).success(function (data){
                workout.data.routines.push(data);
            });
        });
    });

    workout.start = function(id) {
        // Changes the routine from the id to the whole entity
        // Also created arrays for reps and weight
        workout.started = true
        workout.currentRoutineId = id
        workout.currentExerciseId = 0
        workout.exerciseCount = 0

        workout.data.routines[workout.currentRoutineId].startMilliseconds.push(getTimeMilliseconds())
        // var date = new Date(milliseconds);
        // date.toString()
        // Gives you human readable from that

        // Add new rep/weight entries to all exercises of loaded routine
        workout.data.routines[workout.currentRoutineId].exercises.forEach((exercise) => {
            // workout.data.routines[workout.currentRoutineId].exercises[workout.currentExerciseId]
            exercise.reps.push([])
            exercise.weight.push([])
            workout.exerciseCount += 1
        })

        workout.refreshWorkoutData()
    }

    workout.saveItems = function() {
        var currentExercise = workout.data.routines[workout.currentRoutineId].exercises[workout.currentExerciseId]

        // Incase not filled out
        if (workout.currentReps.length !== 0) {
            var repLength = currentExercise.reps.length
            currentExercise.reps[repLength - 1] = workout.currentReps.split(',').map(Number)
        }

        // Incase not filled out
        if (workout.currentWeight.length !== 0) {
            var weightLength = currentExercise.weight.length
            currentExercise.weight[weightLength - 1] = workout.currentWeight.split(',').map(Number)
        }
    }

    workout.refreshWorkoutData = function() {
        workout.previousExerciseData = workout.data.routines[workout.currentRoutineId].exercises[workout.currentExerciseId]

        // Handle first time using routine
        if (workout.previousExerciseData.reps.length > 1) {
            workout.previousExerciseReps = workout.previousExerciseData.reps.slice(Math.max(workout.previousExerciseData.reps.length - 2, 0))[0]
        } else {
            workout.previousExerciseReps = ""
        }

        if (workout.previousExerciseData.weight.length > 1) {
            workout.previousExerciseWeight = workout.previousExerciseData.weight.slice(Math.max(workout.previousExerciseData.weight.length - 2, 0))[0]
        } else {
            workout.previousExerciseWeight = ""
        }

        workout.currentExerciseData = workout.data.routines[workout.currentRoutineId].exercises[workout.currentExerciseId]

        // These will be string inputs on page, but array in data model
        workout.currentReps = workout.currentExerciseData.reps.slice(Math.max(workout.currentExerciseData.reps.length - 1, 0))[0].toString()
        workout.currentWeight = workout.currentExerciseData.weight.slice(Math.max(workout.currentExerciseData.weight.length - 1, 0))[0].toString()
    }

    workout.nextExercise = function() {
        // TODO should just disable button if not available
        if (workout.currentExerciseId < workout.exerciseCount - 1) {
            workout.saveItems()
            workout.currentExerciseId += 1
            workout.refreshWorkoutData()
        }
    }

    workout.previousExercise = function() {
        if (workout.currentExerciseId > 0) {
            workout.saveItems()
            workout.currentExerciseId -= 1
            workout.refreshWorkoutData()
        }
    }

    workout.generateJSON = function() {
        // Ensure current page is saved
        workout.saveItems()

        // Show json entry box
        workout.saved = true

        // Add an end time to the workout
        workout.data.routines[workout.currentRoutineId].endMilliseconds.push(getTimeMilliseconds())

        // Add a human readable workout time
        let endMs = workout.data.routines[workout.currentRoutineId].endMilliseconds
        endMs = endMs[endMs.length - 1];

        let startMs = workout.data.routines[workout.currentRoutineId].startMilliseconds
        startMs = startMs[startMs.length - 1];

        let routineMs = endMs - startMs

        workout.data.routines[workout.currentRoutineId].workoutTime.push(millisecondsToMinSeconds(routineMs));

        let date = new Date(endMs);
        workout.data.routines[workout.currentRoutineId].workoutTimeString.push(date.toString());

        workout.json = JSON.stringify(workout.data.routines[workout.currentRoutineId])
    }
})

