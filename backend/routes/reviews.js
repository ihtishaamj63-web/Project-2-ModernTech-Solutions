import express from "express";
import db from "../config/database.js";

const router = express.Router();

// ===== GET ALL REVIEWS =====
// Retrieves all performance reviews from the database
// Returns reviews sorted by date in descending order
// Includes employee name and reviewer name through JOINs
router.get("/", async (req, res) => {
  try {
    const [reviews] = await db.query(`
            SELECT
                pr.review_id,
                CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
                CONCAT(u.first_name, ' ', u.last_name) AS reviewer_name,
                pr.review_date,
                pr.review_period_start,
                pr.review_period_end,
                pr.rating,
                pr.performance_score,
                pr.strengths,
                pr.areas_for_improvement,
                pr.goals_for_next_period,
                pr.comments,
                pr.status
            FROM performance_reviews pr
            JOIN employees e ON pr.emp_id = e.emp_id
            JOIN users u ON pr.reviewer_id = u.user_id
            ORDER BY pr.review_date DESC
        `);

    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);

    res.status(500).json({
      message: "Failed to fetch reviews",
    });
  }
});

// ===== GET SINGLE REVIEW =====
// Retrieves a single performance review by its ID
// @param {number} id - Review ID from URL parameter
// Returns 404 if review is not found
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [reviews] = await db.query(
      `
            SELECT
                pr.review_id,
                CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
                CONCAT(u.first_name, ' ', u.last_name) AS reviewer_name,
                pr.review_date,
                pr.review_period_start,
                pr.review_period_end,
                pr.rating,
                pr.performance_score,
                pr.strengths,
                pr.areas_for_improvement,
                pr.goals_for_next_period,
                pr.comments,
                pr.status
            FROM performance_reviews pr
            JOIN employees e ON pr.emp_id = e.emp_id
            JOIN users u ON pr.reviewer_id = u.user_id
            WHERE pr.review_id = ?
        `,
      [id],
    );

    if (reviews.length === 0) {
      return res.status(404).json({
        message: "Review not found",
      });
    }

    res.json(reviews[0]);
  } catch (error) {
    console.error("Error fetching review:", error);

    res.status(500).json({
      message: "Failed to fetch review",
    });
  }
});

// ===== CREATE NEW REVIEW =====
// Creates a new performance review in the database
// Requires all review fields to be provided in request body
// Returns the newly created review ID on success
router.post("/", async (req, res) => {
  try {
    const {
      emp_id,
      reviewer_id,
      review_date,
      review_period_start,
      review_period_end,
      rating,
      performance_score,
      strengths,
      areas_for_improvement,
      goals_for_next_period,
      comments,
      status,
    } = req.body;

    const [result] = await db.query(
      `
            INSERT INTO performance_reviews (
                emp_id,
                reviewer_id,
                review_date,
                review_period_start,
                review_period_end,
                rating,
                performance_score,
                strengths,
                areas_for_improvement,
                goals_for_next_period,
                comments,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      [
        emp_id,
        reviewer_id,
        review_date,
        review_period_start,
        review_period_end,
        rating,
        performance_score,
        strengths,
        areas_for_improvement,
        goals_for_next_period,
        comments,
        status,
      ],
    );

    res.status(201).json({
      message: "Review created successfully",
      review_id: result.insertId,
    });
  } catch (error) {
    console.error("Error creating review:", error);

    res.status(500).json({
      message: "Failed to create review",
    });
  }
});

// ===== UPDATE ENTIRE REVIEW =====
// Updates an entire performance review by ID
// Requires all fields to be provided in request body
// Returns 404 if review is not found
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      emp_id,
      reviewer_id,
      review_date,
      review_period_start,
      review_period_end,
      rating,
      performance_score,
      strengths,
      areas_for_improvement,
      goals_for_next_period,
      comments,
      status,
    } = req.body;

    const [result] = await db.query(
      `
            UPDATE performance_reviews
            SET
                emp_id = ?,
                reviewer_id = ?,
                review_date = ?,
                review_period_start = ?,
                review_period_end = ?,
                rating = ?,
                performance_score = ?,
                strengths = ?,
                areas_for_improvement = ?,
                goals_for_next_period = ?,
                comments = ?,
                status = ?
            WHERE review_id = ?
        `,
      [
        emp_id,
        reviewer_id,
        review_date,
        review_period_start,
        review_period_end,
        rating,
        performance_score,
        strengths,
        areas_for_improvement,
        goals_for_next_period,
        comments,
        status,
        id,
      ],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Review not found",
      });
    }

    res.json({
      message: "Review updated successfully",
    });
  } catch (error) {
    console.error("Error updating review:", error);

    res.status(500).json({
      message: "Failed to update review",
      error: error.message,
    });
  }
});

// ===== DELETE REVIEW =====
// Deletes a performance review by its ID
// @param {number} id - Review ID from URL parameter
// Returns 404 if review is not found
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      `
            DELETE FROM performance_reviews
            WHERE review_id = ?
        `,
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Review not found",
      });
    }

    res.json({
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);

    res.status(500).json({
      message: "Failed to delete review",
      error: error.message,
    });
  }
});

// ===== PARTIAL UPDATE REVIEW =====
// Partially updates specific fields of a performance review
// Only updates fields provided in request body
// Validates field names to prevent SQL injection
// @param {number} id - Review ID from URL parameter
// Returns 404 if review is not found
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const fields = req.body;

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({
        message: "No fields provided for update",
      });
    }

    // Whitelist of allowed fields for security
    const allowedFields = [
      "emp_id",
      "reviewer_id",
      "review_date",
      "review_period_start",
      "review_period_end",
      "rating",
      "performance_score",
      "strengths",
      "areas_for_improvement",
      "goals_for_next_period",
      "comments",
      "status",
    ];

    const updates = [];
    const values = [];

    for (const field of Object.keys(fields)) {
      if (!allowedFields.includes(field)) {
        return res.status(400).json({
          message: `Invalid field: ${field}`,
        });
      }

      updates.push(`${field} = ?`);
      values.push(fields[field]);
    }

    values.push(id);

    const [result] = await db.query(
      `UPDATE performance_reviews
             SET ${updates.join(", ")}
             WHERE review_id = ?`,
      values,
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Review not found",
      });
    }

    res.json({
      message: "Review partially updated successfully",
    });
  } catch (error) {
    console.error("Error partially updating review:", error);

    res.status(500).json({
      message: "Failed to partially update review",
      error: error.message,
    });
  }
});

export default router;
