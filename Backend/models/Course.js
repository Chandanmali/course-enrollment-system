const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
      minlength: 3,
      maxlength: 150,
    },

    description: {
      type: String,
      required: [true, "Course description is required"],
      trim: true,
      maxlength: 5000,
    },

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A teacher must be assigned"],
    },

    price: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Price cannot be negative"],
      validate: {
        validator: function (value) {
          return !this.isFree || value === 0;
        },
        message: "Free courses must have a price of zero",
      },
    },

    isFree: {
      type: Boolean,
      default: false,
    },

    duration: {
      type: String,
      required: [true, "Course duration is required"],
      trim: true,
      maxlength: 100,
    },

    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: [true, "Course level is required"],
    },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

courseSchema.index({ teacherId: 1, status: 1, isActive: 1 });

module.exports = mongoose.model("Course", courseSchema);
