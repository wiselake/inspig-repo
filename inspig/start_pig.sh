#!/bin/bash
cd /c/Projects/pig3.1

# .claude 폴더 및 instructions 설정
mkdir -p .claude
cp insitepig.md .claude/instructions.md

echo "================================================"
echo "Claude Code - Pig3.1 Project"
echo "Auto-loading: insitepig.md"
echo "================================================"
echo ""

# Claude Code 실행
npx @anthropic-ai/claude-code