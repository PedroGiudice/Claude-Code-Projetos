#!/bin/bash
cd /home/cmr-auto/claude-work/repos/lex-vector/legal-workbench/ferramentas/legal-doc-assembler
export PYTHONPATH=.
/home/cmr-auto/claude-work/repos/lex-vector/.venv/bin/pytest tests/ -v
