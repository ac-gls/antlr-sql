# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a web application project that:
- Uses Vite as the build tool
- Uses Stimulus.js for JavaScript behavior
- Uses ANTLR for parsing SQL CASE statements  
- Uses Kendo UI for filter components
- Converts SQL CASE statements like "case when [Q4] in (1, 2, 3) then 1 else NULL end" to Kendo UI filter expressions
- Q4 represents survey questions and 1,2,3 are answer values

When working on this project:
- Follow modern JavaScript ES6+ practices
- Use Stimulus controller patterns for organizing behavior
- Generate ANTLR parsers using the grammar files in the `grammar/` directory
- Structure filter conversion logic to handle survey question mappings
- Use semantic class names and data attributes for Stimulus targets
