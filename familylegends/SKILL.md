---
name: familylegends-mcp-workflow
description: Guidelines for the AI when using Netlify and Firebase MCP tools in the Family Legends project.
---

# Family Legends MCP Workflow

Instructions for the agent to follow when interacting with Firebase and Netlify for this project.

## When to use

Whenever the user asks to deploy to Netlify, fix a Netlify build error, initialize a Firebase service, or modify Firebase configurations/security rules within the `familylegends` workspace.

## Instructions

1. **For Netlify build issues:** 
   - Always read the Netlify deployment logs using Netlify MCP tools or by analyzing the local `build.log` if provided.
   - For Next.js 15, ensure legacy Netlify plugins are not causing conflicts in `netlify.toml` and manage `next.config.ts` accordingly.

2. **For Firebase configuration:**
   - The project operates with `firebase.json` and `firestore.rules` locally. 
   - Use `firebase_update_environment` to set the project directory if Firebase MCP asks for it.
   - If deploying security rules, prompt the user to use the Firebase CLI (`firebase deploy --only firestore:rules`) or execute the command yourself via `run_command` if safe.

3. **GCP/Firebase Research:** 
   - Use the `search_documents` from `firebase-mcp-server` for up-to-date documentation on Cloud Firestore rules and Next.js integrations.

Remember to strictly adhere to the AI rules laid out in `AI_INSTRUCTIONS.md`.
