import React, { useState, useReducer, useEffect } from "react";

// ===============================================
// DATA STRUCTURES AND INITIAL STATES
// ===============================================

const initialMediaElement = {
  id: Date.now(),
  text: "",
  translation: "",
  audioFile: null,
  audioUrl: "",
};

const initialActivityData = {
  id: Date.now(),
  type: "multiple-choice",
  title: "",
  description: "",
  question: { ...initialMediaElement },
  options: [
    { ...initialMediaElement, isCorrect: true },
    { ...initialMediaElement, isCorrect: false },
    { ...initialMediaElement, isCorrect: false },
  ],
  items: [{ ...initialMediaElement }],
  pairs: [{ ...initialMediaElement, image: "" }],
  wordBlocks: [],
  difficulty: "beginner", // beginner, intermediate, advanced
  timeEstimate: 5, // minutes
};

const initialLessonState = {
  id: Date.now(),
  title: "",
  description: "",
  level: "beginner",
  objectives: [""],
  introParts: [""],
  activities: [],
  tags: [],
  currentView: "list",
  isSaved: false,
  isPublished: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ===============================================
// REDUCER FOR STATE MANAGEMENT
// ===============================================

const lessonReducer = (state, action) => {
  switch (action.type) {
    case "SET_FIELD":
      return {
        ...state,
        [action.field]: action.value,
        updatedAt: new Date().toISOString(),
      };

    case "ADD_ACTIVITY":
      return {
        ...state,
        activities: [
          ...state.activities,
          { ...action.activity, id: Date.now() },
        ],
        updatedAt: new Date().toISOString(),
      };

    case "UPDATE_ACTIVITY":
      return {
        ...state,
        activities: state.activities.map((act) =>
          act.id === action.id ? { ...action.activity, id: act.id } : act
        ),
        updatedAt: new Date().toISOString(),
      };

    case "DELETE_ACTIVITY":
      return {
        ...state,
        activities: state.activities.filter((act) => act.id !== action.id),
        updatedAt: new Date().toISOString(),
      };

    case "REORDER_ACTIVITIES":
      return {
        ...state,
        activities: action.activities,
        updatedAt: new Date().toISOString(),
      };

    case "SET_VIEW":
      return { ...state, currentView: action.view };

    case "RESET_LESSON":
      return {
        ...initialLessonState,
        id: Date.now(),
        currentView: "setup",
      };

    case "LOAD_LESSON":
      return {
        ...action.lesson,
        currentView: "setup",
        updatedAt: new Date().toISOString(),
      };

    default:
      return state;
  }
};

// ===============================================
// UTILITY FUNCTIONS
// ===============================================

const generateId = () => Date.now() + Math.random();

const validateActivity = (activity) => {
  const errors = [];

  if (!activity.title?.trim()) {
    errors.push("Activity title is required");
  }

  if (!activity.question?.text?.trim()) {
    errors.push("Question text is required");
  }

  switch (activity.type) {
    case "multiple-choice":
      const validOptions = activity.options.filter((opt) => opt.text.trim());
      if (validOptions.length < 2) {
        errors.push("At least 2 options are required");
      }
      if (!activity.options.some((opt) => opt.isCorrect)) {
        errors.push("One option must be marked as correct");
      }
      break;

    case "ordering":
    case "dialogue":
      if (activity.items.length < 2) {
        errors.push("At least 2 items are required");
      }
      break;

    case "match-image":
      if (activity.pairs.length < 2) {
        errors.push("At least 2 pairs are required");
      }
      break;

    case "fill-in-blanks":
      if (!activity.question.text.includes("{")) {
        errors.push("Sentence must contain blanks marked with {word}");
      }
      break;
  }

  return errors;
};

// ===============================================
// REUSABLE COMPONENTS
// ===============================================

const MediaElementInput = ({
  label,
  value,
  onChangeText,
  onChangeAudio,
  onDelete,
  showDelete = false,
  isDarija = true,
  isQuestion = false,
}) => (
  <div className="border p-4 rounded-lg bg-white mt-3 shadow-sm">
    <div className="flex justify-between items-center mb-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label} {isDarija ? "(Darija)" : "(English)"}
      </label>
      {showDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="text-red-500 hover:text-red-700 text-sm"
        >
          Delete
        </button>
      )}
    </div>

    <input
      type="text"
      value={value.text}
      onChange={(e) => onChangeText("text", e.target.value)}
      placeholder={
        isDarija ? "Enter Darija phrase" : "Enter English translation"
      }
      className="p-2 border border-gray-300 rounded w-full mb-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
    />

    <input
      type="text"
      value={value.translation}
      onChange={(e) => onChangeText("translation", e.target.value)}
      placeholder={isDarija ? "English translation" : "Darija equivalent"}
      className="p-2 border border-gray-300 rounded w-full mb-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
    />

    <label className="block text-xs font-medium text-gray-600 mb-1">
      {isQuestion ? "Question Audio" : "Phrase Audio"} (Optional)
    </label>
    <input
      type="file"
      accept="audio/*"
      onChange={onChangeAudio}
      className="w-full text-sm p-2 border border-gray-300 rounded file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
    />

    {value.audioFile && (
      <p className="text-xs text-green-600 mt-2 flex items-center">
        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
        File: {value.audioFile.name}
      </p>
    )}
  </div>
);

const ActivityPreview = ({ activity, index, onEdit, onDelete }) => {
  const getActivityIcon = (type) => {
    const icons = {
      "multiple-choice": "🔘",
      "fill-in-blanks": "📝",
      ordering: "🔢",
      "match-image": "🖼️",
      dialogue: "💬",
    };
    return icons[type] || "📋";
  };

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getActivityIcon(activity.type)}</span>
          <div>
            <h4 className="font-semibold text-gray-800">
              {activity.title || `Activity ${index + 1}`}
            </h4>
            <p className="text-sm text-gray-600 capitalize">
              {activity.type.replace("-", " ")}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(activity)}
            className="text-indigo-600 hover:text-indigo-800 text-sm px-3 py-1 border border-indigo-600 rounded hover:bg-indigo-50 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(activity.id)}
            className="text-red-600 hover:text-red-800 text-sm px-3 py-1 border border-red-600 rounded hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-700 mt-2 line-clamp-2">
        {activity.question.text}
      </p>

      <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
        <span>Difficulty: {activity.difficulty}</span>
        <span>{activity.timeEstimate} min</span>
      </div>
    </div>
  );
};

// ===============================================
// MAIN TEACHER DASHBOARD COMPONENT
// ===============================================

const TeacherDashboard = () => {
  const [lessonState, dispatch] = useReducer(lessonReducer, initialLessonState);
  const [tempActivity, setTempActivity] = useState(initialActivityData);
  const [isEditingActivity, setIsEditingActivity] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // Load saved lessons from localStorage on component mount
  useEffect(() => {
    const savedLessons = localStorage.getItem("darija-lessons");
    if (savedLessons) {
      // You could set this to state if you want to show existing lessons
      console.log("Loaded saved lessons:", JSON.parse(savedLessons));
    }
  }, []);

  // Save lessons to localStorage whenever lessonState changes
  useEffect(() => {
    if (lessonState.activities.length > 0) {
      const lessons = JSON.parse(
        localStorage.getItem("darija-lessons") || "[]"
      );
      const existingIndex = lessons.findIndex(
        (lesson) => lesson.id === lessonState.id
      );

      if (existingIndex >= 0) {
        lessons[existingIndex] = lessonState;
      } else {
        lessons.push(lessonState);
      }

      localStorage.setItem("darija-lessons", JSON.stringify(lessons));
    }
  }, [lessonState]);

  // ===============================================
  // ACTIVITY MANAGEMENT FUNCTIONS
  // ===============================================

  const handleAudioUpload = async (field, file) => {
    // Simulate file upload - in real app, upload to cloud storage
    return new Promise((resolve) => {
      setTimeout(() => {
        const fileUrl = URL.createObjectURL(file);
        resolve({ name: file.name, url: fileUrl });
      }, 500);
    });
  };

  const handleMediaElementChange = async (
    field,
    key,
    value,
    isAudio = false,
    elementIndex = null
  ) => {
    if (isAudio && value) {
      const audioData = await handleAudioUpload(key, value);
      setTempActivity((prev) => {
        let newField = Array.isArray(prev[field])
          ? [...prev[field]]
          : { ...prev[field] };

        if (elementIndex !== null) {
          newField[elementIndex] = {
            ...newField[elementIndex],
            audioFile: audioData,
          };
        } else {
          newField = { ...newField, audioFile: audioData };
        }

        return { ...prev, [field]: newField };
      });
    } else {
      setTempActivity((prev) => {
        let newField = Array.isArray(prev[field])
          ? [...prev[field]]
          : { ...prev[field] };

        if (elementIndex !== null) {
          newField[elementIndex] = { ...newField[elementIndex], [key]: value };
        } else {
          newField = { ...newField, [key]: value };
        }

        return { ...prev, [field]: newField };
      });
    }
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setTempActivity({
      ...initialActivityData,
      id: tempActivity.id,
      type: newType,
      title: tempActivity.title || `New ${newType.replace("-", " ")} activity`,
    });
  };

  const saveActivity = () => {
    const errors = validateActivity(tempActivity);

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);

    if (isEditingActivity) {
      dispatch({
        type: "UPDATE_ACTIVITY",
        id: tempActivity.id,
        activity: tempActivity,
      });
    } else {
      dispatch({ type: "ADD_ACTIVITY", activity: tempActivity });
    }

    resetTempActivity();
  };

  const editActivity = (activity) => {
    setTempActivity(activity);
    setIsEditingActivity(true);
    dispatch({ type: "SET_VIEW", view: "builder" });
  };

  const resetTempActivity = () => {
    setTempActivity({ ...initialActivityData, id: generateId() });
    setIsEditingActivity(false);
    setValidationErrors([]);
  };

  const deleteActivity = (id) => {
    if (window.confirm("Are you sure you want to delete this activity?")) {
      dispatch({ type: "DELETE_ACTIVITY", id });
    }
  };

  // ===============================================
  // ACTIVITY TYPE RENDERERS
  // ===============================================

  const renderActivitySettings = () => {
    const { type, question, options, items, pairs, difficulty, timeEstimate } =
      tempActivity;

    const commonFields = (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Activity Title *
          </label>
          <input
            type="text"
            value={tempActivity.title}
            onChange={(e) =>
              setTempActivity((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="Enter activity title"
            className="p-2 border border-gray-300 rounded w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <MediaElementInput
          label="Question/Instruction *"
          value={question}
          onChangeText={(key, value) =>
            setTempActivity((prev) => ({
              ...prev,
              question: { ...prev.question, [key]: value },
            }))
          }
          onChangeAudio={(e) =>
            handleMediaElementChange(
              "question",
              "audioFile",
              e.target.files[0],
              true
            )
          }
          isDarija={false}
          isQuestion={true}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) =>
                setTempActivity((prev) => ({
                  ...prev,
                  difficulty: e.target.value,
                }))
              }
              className="p-2 border border-gray-300 rounded w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Time Estimate (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={timeEstimate}
              onChange={(e) =>
                setTempActivity((prev) => ({
                  ...prev,
                  timeEstimate: parseInt(e.target.value),
                }))
              }
              className="p-2 border border-gray-300 rounded w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    );

    switch (type) {
      case "multiple-choice":
        return (
          <>
            {commonFields}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-gray-800">Answer Options *</h4>
                <button
                  type="button"
                  onClick={() =>
                    setTempActivity((prev) => ({
                      ...prev,
                      options: [
                        ...prev.options,
                        { ...initialMediaElement, isCorrect: false },
                      ],
                    }))
                  }
                  className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition-colors"
                >
                  + Add Option
                </button>
              </div>

              {options.map((opt, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <input
                    type="radio"
                    name="mc-correct"
                    checked={opt.isCorrect}
                    onChange={() =>
                      setTempActivity((prev) => ({
                        ...prev,
                        options: prev.options.map((o, i) => ({
                          ...o,
                          isCorrect: i === index,
                        })),
                      }))
                    }
                    className="w-5 h-5 text-indigo-600 mt-3"
                  />

                  <div className="flex-grow">
                    <MediaElementInput
                      label={`Option ${index + 1}`}
                      value={opt}
                      onChangeText={(key, value) =>
                        handleMediaElementChange(
                          "options",
                          key,
                          value,
                          false,
                          index
                        )
                      }
                      onChangeAudio={(e) =>
                        handleMediaElementChange(
                          "options",
                          "audioFile",
                          e.target.files[0],
                          true,
                          index
                        )
                      }
                      onDelete={() => {
                        if (options.length > 2) {
                          setTempActivity((prev) => ({
                            ...prev,
                            options: prev.options.filter((_, i) => i !== index),
                          }));
                        }
                      }}
                      showDelete={options.length > 2}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        );

      case "ordering":
      case "dialogue":
        return (
          <>
            {commonFields}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-gray-800">
                  {type === "dialogue"
                    ? "Dialogue Lines *"
                    : "Items to Order *"}
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    setTempActivity((prev) => ({
                      ...prev,
                      items: [...prev.items, { ...initialMediaElement }],
                    }))
                  }
                  className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition-colors"
                >
                  + Add Item
                </button>
              </div>

              {items.map((item, index) => (
                <MediaElementInput
                  key={index}
                  label={`${type === "dialogue" ? "Line" : "Item"} ${
                    index + 1
                  }`}
                  value={item}
                  onChangeText={(key, value) =>
                    handleMediaElementChange("items", key, value, false, index)
                  }
                  onChangeAudio={(e) =>
                    handleMediaElementChange(
                      "items",
                      "audioFile",
                      e.target.files[0],
                      true,
                      index
                    )
                  }
                  onDelete={() => {
                    if (items.length > 1) {
                      setTempActivity((prev) => ({
                        ...prev,
                        items: prev.items.filter((_, i) => i !== index),
                      }));
                    }
                  }}
                  showDelete={items.length > 1}
                />
              ))}
            </div>
          </>
        );

      case "match-image":
        return (
          <>
            {commonFields}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-gray-800">Matching Pairs *</h4>
                <button
                  type="button"
                  onClick={() =>
                    setTempActivity((prev) => ({
                      ...prev,
                      pairs: [
                        ...prev.pairs,
                        { ...initialMediaElement, image: "" },
                      ],
                    }))
                  }
                  className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition-colors"
                >
                  + Add Pair
                </button>
              </div>

              {pairs.map((pair, index) => (
                <div
                  key={index}
                  className="mt-3 p-4 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="font-semibold text-gray-700">
                      Pair {index + 1}
                    </h5>
                    <button
                      type="button"
                      onClick={() => {
                        if (pairs.length > 1) {
                          setTempActivity((prev) => ({
                            ...prev,
                            pairs: prev.pairs.filter((_, i) => i !== index),
                          }));
                        }
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete Pair
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <MediaElementInput
                        label="Darija Phrase"
                        value={pair}
                        onChangeText={(key, value) =>
                          handleMediaElementChange(
                            "pairs",
                            key,
                            value,
                            false,
                            index
                          )
                        }
                        onChangeAudio={(e) =>
                          handleMediaElementChange(
                            "pairs",
                            "audioFile",
                            e.target.files[0],
                            true,
                            index
                          )
                        }
                        isDarija={true}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Image/Emoji *
                      </label>
                      <input
                        type="text"
                        value={pair.image}
                        onChange={(e) =>
                          handleMediaElementChange(
                            "pairs",
                            "image",
                            e.target.value,
                            false,
                            index
                          )
                        }
                        placeholder="Enter emoji or image URL"
                        className="p-2 border border-gray-300 rounded w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-2xl text-center"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use emojis like 🌅, 🍵, or image URLs
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        );

      case "fill-in-blanks":
        return (
          <>
            {commonFields}
            <div className="mt-6">
              <h4 className="font-bold text-gray-800 mb-3">
                Sentence Template *
              </h4>
              <textarea
                value={question.text}
                onChange={(e) =>
                  setTempActivity((prev) => ({
                    ...prev,
                    question: { ...prev.question, text: e.target.value },
                  }))
                }
                placeholder="Enter sentence with blanks marked like {correct_word}. Example: Smeety Alex, o {nty}?"
                className="p-3 border border-gray-300 rounded w-full h-24 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows="4"
              />
              <p className="text-sm text-gray-600 mt-2">
                Use curly braces {"{}"} to mark the blanks. The system will
                automatically extract words like "nty" as correct answers.
              </p>

              <div className="mt-4">
                <label className="block font-semibold text-gray-700 mb-2">
                  Additional Distractor Words (Optional)
                </label>
                <input
                  type="text"
                  value={tempActivity.wordBlocks.join(", ")}
                  onChange={(e) =>
                    setTempActivity((prev) => ({
                      ...prev,
                      wordBlocks: e.target.value
                        .split(",")
                        .map((w) => w.trim())
                        .filter((w) => w),
                    }))
                  }
                  placeholder="Enter comma-separated words: nta, labass, smeetk"
                  className="p-2 border border-gray-300 rounded w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  // ===============================================
  // MAIN RENDER LOGIC
  // ===============================================

  // Lesson List View
  if (lessonState.currentView === "list") {
    const savedLessons = JSON.parse(
      localStorage.getItem("darija-lessons") || "[]"
    );

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-indigo-700 mb-2">
              Darija Learning Platform
            </h1>
            <p className="text-gray-600">
              Teacher Dashboard - Lesson Management
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Your Lessons</h2>
              <button
                onClick={() => dispatch({ type: "RESET_LESSON" })}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md"
              >
                + Create New Lesson
              </button>
            </div>

            {savedLessons.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No lessons yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Create your first lesson to get started
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {savedLessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-800">
                          {lesson.title}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {lesson.activities.length} activities • {lesson.level}{" "}
                          • Last updated:{" "}
                          {new Date(lesson.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            dispatch({ type: "LOAD_LESSON", lesson })
                          }
                          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors">
                          Preview
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Lesson Setup View
  if (lessonState.currentView === "setup") {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-indigo-700">
                  Lesson Setup
                </h1>
                <p className="text-gray-600">
                  Define your lesson's basic information and objectives
                </p>
              </div>
              <button
                onClick={() => dispatch({ type: "SET_VIEW", view: "list" })}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Lessons
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Lesson Title *
                </label>
                <input
                  type="text"
                  value={lessonState.title}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_FIELD",
                      field: "title",
                      value: e.target.value,
                    })
                  }
                  className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Lesson 1: Basic Greetings in Darija"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Lesson Description
                </label>
                <textarea
                  value={lessonState.description}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_FIELD",
                      field: "description",
                      value: e.target.value,
                    })
                  }
                  className="p-3 border border-gray-300 rounded-lg w-full h-24 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Brief description of what students will learn..."
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Level
                </label>
                <select
                  value={lessonState.level}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_FIELD",
                      field: "level",
                      value: e.target.value,
                    })
                  }
                  className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-lg font-semibold text-gray-700">
                    Learning Objectives *
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: "SET_FIELD",
                        field: "objectives",
                        value: [...lessonState.objectives, ""],
                      })
                    }
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold"
                  >
                    + Add Objective
                  </button>
                </div>
                {lessonState.objectives.map((obj, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={obj}
                      onChange={(e) => {
                        const newObjs = [...lessonState.objectives];
                        newObjs[index] = e.target.value;
                        dispatch({
                          type: "SET_FIELD",
                          field: "objectives",
                          value: newObjs,
                        });
                      }}
                      className="p-3 border border-gray-300 rounded-lg flex-grow focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g., Use basic greeting expressions in Darija"
                    />
                    {lessonState.objectives.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newObjs = lessonState.objectives.filter(
                            (_, i) => i !== index
                          );
                          dispatch({
                            type: "SET_FIELD",
                            field: "objectives",
                            value: newObjs,
                          });
                        }}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Instructional Content
                </label>
                <textarea
                  value={lessonState.introParts[0]}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_FIELD",
                      field: "introParts",
                      value: [e.target.value],
                    })
                  }
                  className="p-3 border border-gray-300 rounded-lg w-full h-32 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter your instructional text, grammar explanations, cultural notes, etc."
                />
              </div>

              <div className="flex justify-between pt-6 border-t">
                <button
                  onClick={() => dispatch({ type: "SET_VIEW", view: "list" })}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    dispatch({ type: "SET_VIEW", view: "builder" })
                  }
                  className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Continue to Activity Builder →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Activity Builder View
  if (lessonState.currentView === "builder") {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-indigo-700">
                  Activity Builder
                </h1>
                <p className="text-gray-600">
                  Building: <strong>{lessonState.title}</strong> •
                  {lessonState.activities.length} activities added
                </p>
              </div>
              <button
                onClick={() => dispatch({ type: "SET_VIEW", view: "setup" })}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Setup
              </button>
            </div>

            {/* Current Activities */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Lesson Activities ({lessonState.activities.length})
              </h2>

              {lessonState.activities.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-4xl mb-4">📝</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No activities yet
                  </h3>
                  <p className="text-gray-500">
                    Start by adding your first activity below
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {lessonState.activities.map((activity, index) => (
                    <ActivityPreview
                      key={activity.id}
                      activity={activity}
                      index={index}
                      onEdit={editActivity}
                      onDelete={deleteActivity}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Add New Activity */}
            <section className="border-t pt-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {isEditingActivity ? "Edit Activity" : "Add New Activity"}
              </h2>

              {/* Activity Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Activity Type
                </label>
                <select
                  value={tempActivity.type}
                  onChange={handleTypeChange}
                  className="p-3 border border-gray-300 rounded-lg w-full bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="fill-in-blanks">Fill in the Blanks</option>
                  <option value="ordering">Ordering Elements</option>
                  <option value="match-image">Match Phrase to Image</option>
                  <option value="dialogue">Dialogue Practice</option>
                </select>
              </div>

              {/* Activity Settings */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  {tempActivity.type.replace("-", " ").toUpperCase()} Settings
                </h3>

                {validationErrors.length > 0 && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">
                      Please fix the following errors:
                    </h4>
                    <ul className="list-disc list-inside text-red-700 text-sm">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {renderActivitySettings()}
              </div>

              {/* Save Activity Button */}
              <button
                onClick={saveActivity}
                className="mt-6 bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors w-full font-bold text-lg shadow-md"
              >
                {isEditingActivity
                  ? "Update Activity"
                  : "Save Activity to Lesson"}
              </button>

              {isEditingActivity && (
                <button
                  onClick={resetTempActivity}
                  className="mt-3 bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600 transition-colors w-full"
                >
                  Cancel Edit
                </button>
              )}
            </section>

            {/* Final Actions */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t">
              <button
                onClick={() => dispatch({ type: "SET_VIEW", view: "setup" })}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                ← Back to Lesson Setup
              </button>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    // Preview functionality
                    console.log("Preview Lesson:", lessonState);
                    alert("Preview functionality would open in a new tab");
                  }}
                  className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  Preview Lesson
                </button>

                <button
                  onClick={() => {
                    // Save and publish
                    dispatch({
                      type: "SET_FIELD",
                      field: "isPublished",
                      value: true,
                    });
                    alert("Lesson published successfully!");
                  }}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md"
                >
                  Save & Publish Lesson
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default TeacherDashboard;
