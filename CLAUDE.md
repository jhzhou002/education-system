# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **智学 (SmartStudy)**, an intelligent learning platform designed primarily for Chinese high school students. The platform initially focuses on mathematics and plans to expand to physics, chemistry, and biology. The system provides AI-driven personalized learning paths, adaptive testing, and cross-subject knowledge mapping.

## Project Status

This repository currently contains only documentation files. No actual code implementation exists yet - this is in the planning/design phase.

## Key Documents

- `智学——智能刷题平台开发文档（MVP）.md` - Comprehensive Chinese development documentation containing:
  - Complete database schema with 20+ tables
  - Multi-subject knowledge point taxonomy (mathematics focus)
  - AI-powered question generation specifications
  - User learning analytics and progression tracking
  - Technical architecture planning

## Database Schema Overview

The platform is designed around a sophisticated multi-subject education system with these core entities:

### Core Tables
- `sl_users` - User management with role-based access
- `sl_subjects` - Subject definitions (数学, 物理, 化学, 生物)
- `sl_knowledge_points` - Hierarchical knowledge taxonomy based on Chinese education standards
- `sl_questions` - AI-generated and curated question bank
- `sl_user_progress` - Learning analytics and mastery tracking

### Knowledge Management
- Supports Chinese education curriculum standards (人教版A版 for mathematics)
- Three-tier structure: Grade (高一/高二/高三) → Semester → Knowledge Points
- Cross-subject knowledge relationships and prerequisites
- Exam frequency weighting and difficulty progression

### AI Features
- Question generation with LaTeX/MathML support
- Adaptive difficulty adjustment based on user performance
- Personalized learning path recommendations
- Cross-subject knowledge correlation analysis

## Technology Stack (Planned)

Based on the documentation, the system will likely use:
- Backend: Java/Spring Boot or Node.js with Express
- Database: MySQL with complex relational schema
- AI/ML: Integration with LLM APIs for question generation
- Frontend: Modern web framework (React/Vue.js likely)
- Math rendering: LaTeX/MathJax for mathematical content

## Development Guidelines

When implementing this system:

1. **Chinese Education Standards Compliance**: All knowledge points must align with official 教育部课程标准
2. **Mathematical Content**: Heavy use of LaTeX for formula rendering
3. **Hierarchical Data**: Extensive use of self-referencing tables for knowledge taxonomy
4. **AI Integration**: Question generation must include validation and quality scoring
5. **Analytics Focus**: User progress tracking is central to the platform's value proposition

## Current State

- Repository contains detailed planning documentation in Chinese
- No code implementation has begun
- Ready for initial development sprint planning
- Database schema is well-defined and ready for implementation