# CLAUDE_CODE_OPUS_45_PROMPT_ENGINEERING_REFERENCE

```yaml
document_metadata:
  type: knowledge_base_reference
  target_system: gemini_ai_studio_build_mode
  purpose: prompt_analysis_optimization_application
  source_compilation_date: 2026-01-09
  primary_subject: claude_code_opus_4.5_prompting
  authentication_context: anthropic_account_login
  version: 1.0
```

---

## SECTION_001_MODEL_IDENTITY_CONFIGURATION

```yaml
model_specifications:
  name: Claude Opus 4.5
  model_string: claude-opus-4-5-20251101
  release_date: 2025-11-24
  creator: Anthropic
  category: frontier_reasoning_model
  primary_strengths:
    - long_horizon_reasoning
    - state_tracking
    - agentic_coding
    - multi_step_execution
    - subagent_orchestration
    - frontend_design
    - vision_capabilities
  token_efficiency: 50_percent_reduction_vs_prior_opus
```

### MODEL_BEHAVIORAL_CHARACTERISTICS

```yaml
opus_45_traits:
  instruction_following: precise
  communication_style: concise_direct_grounded
  proactivity_level: high
  abstraction_tendency: overengineering_prone
  tool_trigger_sensitivity: elevated
  thinking_word_sensitivity: elevated_when_extended_thinking_disabled
  parallel_tool_calling: aggressive
  state_tracking_capability: exceptional
  context_awareness: enabled_by_default
```

---

## SECTION_002_AUTHENTICATION_CONTEXT_LOGIN_MODE

```yaml
authentication_mode:
  type: anthropic_account_login
  method: browser_oauth
  command: "/login"
  api_key_not_required: true
  credential_storage:
    macos: encrypted_keychain
    linux: system_credential_store
    windows: credential_manager
```

### LOGIN_VS_API_KEY_DISTINCTIONS

```yaml
login_authentication:
  billing_model: subscription_based
  plans_available:
    - pro_20_usd_month
    - max_5x_100_usd_month
    - max_20x_200_usd_month
  usage_limits:
    structure: session_based_rolling_window
    reset_period: 5_hours
    weekly_caps: enabled_since_august_2025
  models_accessible:
    pro: [sonnet_4, sonnet_4.5]
    max: [sonnet_4, sonnet_4.5, opus_4.5]
  context_window: 200k_tokens
  features_included:
    - claude_code_terminal_access
    - web_interface_shared_limits
    - automatic_model_switching
    - priority_access_during_peak

api_key_authentication:
  billing_model: pay_per_token
  context_window: 1M_tokens_sonnet
  dedicated_limits: true
  separated_from_web_usage: true
  pricing_per_million_tokens:
    opus_input: 5_usd
    opus_output: 25_usd
```

### LOGIN_MODE_USAGE_PARAMETERS

```yaml
pro_plan_limits:
  messages_per_5h_window: ~45
  claude_code_prompts_per_5h: 10-40
  weekly_sonnet_hours: 40-80
  opus_access: false

max_5x_limits:
  messages_per_5h_window: ~225
  claude_code_prompts_per_5h: 50-200
  weekly_sonnet_hours: 140-280
  weekly_opus_hours: 15-35
  auto_model_switch_threshold: 20_percent_usage

max_20x_limits:
  messages_per_5h_window: ~900
  claude_code_prompts_per_5h: 200-800
  weekly_sonnet_hours: 240-480
  weekly_opus_hours: 24-40
  auto_model_switch_threshold: 50_percent_usage

limit_calculation_factors:
  - message_length
  - conversation_context_size
  - file_attachment_size
  - codebase_complexity
  - parallel_session_count
  - auto_accept_mode_status
```

---

## SECTION_003_PROMPT_STRUCTURE_PATTERNS

### XML_TAG_ARCHITECTURE

```yaml
xml_tag_usage:
  purpose: structural_clarity_parsing_accuracy
  recommendation_level: situational_modern_models
  primary_benefits:
    - section_demarcation
    - instruction_isolation
    - output_parseability
    - context_separation
  
tag_naming_conventions:
  rule: descriptive_logical_names
  format: snake_case_or_descriptive
  examples:
    - <instructions>
    - <context>
    - <examples>
    - <output_format>
    - <constraints>
    - <thinking>
    - <answer>
    - <coding_guidelines>
    - <tool_behavior>
```

### RECOMMENDED_TAG_PATTERNS

```xml
<!-- INSTRUCTION_ISOLATION -->
<instructions>
  Specific task directives here.
</instructions>

<!-- CONTEXT_PROVISION -->
<context>
  Background information and domain knowledge.
</context>

<!-- EXAMPLE_ENCAPSULATION -->
<examples>
  <example>
    <input>Sample input</input>
    <output>Expected output</output>
  </example>
</examples>

<!-- OUTPUT_SPECIFICATION -->
<output_format>
  Structure and format requirements.
</output_format>

<!-- BEHAVIORAL_CONSTRAINTS -->
<constraints>
  Boundaries and limitations.
</constraints>

<!-- REASONING_SEPARATION -->
<thinking>
  Internal reasoning process.
</thinking>
<answer>
  Final response.
</answer>
```

### HIERARCHICAL_NESTING_PATTERN

```xml
<task>
  <context>
    <domain>...</domain>
    <background>...</background>
  </context>
  <instructions>
    <primary>...</primary>
    <secondary>...</secondary>
  </instructions>
  <constraints>
    <must_do>...</must_do>
    <must_not>...</must_not>
  </constraints>
</task>
```

---

## SECTION_004_SEMANTIC_OPTIMIZATION_TECHNIQUES

### EXPLICIT_INSTRUCTION_FORMULATION

```yaml
principle: clarity_over_implication
opus_45_behavior: precise_instruction_following

transformation_patterns:
  vague_to_explicit:
    before: "suggest some changes"
    after: "implement these changes directly"
    
  implicit_to_explicit:
    before: "help with this code"
    after: "refactor this function to improve readability and add error handling"
    
  general_to_specific:
    before: "create a dashboard"
    after: "create an analytics dashboard with user metrics, revenue charts, and real-time activity feed"
```

### CONTEXT_PROVISION_METHODOLOGY

```yaml
context_enhancement:
  purpose: goal_understanding_improvement
  technique: motivation_explanation
  
pattern:
  structure: |
    [TASK_DESCRIPTION]
    
    [MOTIVATION/REASON]
    Why this matters: [explanation]
    
    [EXPECTED_OUTCOME]
    Success criteria: [criteria]
```

### VERB_SENSITIVITY_HANDLING

```yaml
thinking_word_sensitivity:
  applies_when: extended_thinking_disabled
  affected_words: [think, thinking, thought]
  
replacement_mappings:
  think: [consider, evaluate, analyze, assess, examine]
  thinking: [considering, evaluating, analyzing, assessing]
  thought: [considered, evaluated, analyzed, assessed]
  
example_transformation:
  before: "Think through this problem step by step"
  after: "Evaluate this problem step by step"
```

---

## SECTION_005_AMBIGUITY_RESOLUTION_FRAMEWORK

### AMBIGUITY_IDENTIFICATION_CATEGORIES

```yaml
ambiguity_types:
  lexical:
    description: words_with_multiple_meanings
    resolution: context_specification
    
  structural:
    description: unclear_sentence_relationships
    resolution: explicit_grouping
    
  referential:
    description: unclear_pronoun_antecedents
    resolution: explicit_naming
    
  scope:
    description: unclear_modifier_application
    resolution: boundary_definition
    
  temporal:
    description: unclear_time_references
    resolution: date_time_specification
```

### DISAMBIGUATION_PROMPT_PATTERNS

```yaml
before_after_transformations:

  referential_ambiguity:
    before: "Schedule a meeting with sales and deliver the report to them next week"
    after: "Schedule a meeting with the Sales Team leads for the ACME Corp account on Tuesday, December 12, 2025. Present the Q4 Sales Performance Report during this meeting."
    
  scope_ambiguity:
    before: "Fix the bug and update documentation"
    after: "Fix the authentication timeout bug in auth.py. Then update the API documentation in docs/auth.md to reflect the new timeout parameters."
    
  action_ambiguity:
    before: "Improve the code"
    after: "Refactor the getUserData function to: 1) Add input validation, 2) Implement error handling with specific error types, 3) Add JSDoc comments"
```

### CONDITIONAL_LOGIC_SPECIFICATION

```yaml
edge_case_handling:
  pattern: explicit_if_then_logic
  
structure:
  format: |
    IF [condition_A]:
      THEN [action_A]
    ELSE IF [condition_B]:
      THEN [action_B]
    ELSE:
      [default_action]
      
example:
  implementation: |
    If the file exists:
      Read and modify in place
    If the file does not exist:
      Create new file with default template
    If permission denied:
      Report error and suggest chmod command
```

---

## SECTION_006_TOOL_USAGE_OPTIMIZATION

### TOOL_TRIGGER_CALIBRATION

```yaml
opus_45_tool_behavior:
  sensitivity: elevated_to_system_prompt
  risk: overtriggering_from_aggressive_prompts
  
language_adjustment:
  reduce_from:
    - "CRITICAL: You MUST use this tool when..."
    - "ALWAYS call the search function before..."
    - "You are REQUIRED to..."
  
  normalize_to:
    - "Use this tool when..."
    - "Call the search function before..."
    - "You should..."
```

### PROACTIVE_VS_CONSERVATIVE_ACTION

```yaml
proactive_action_prompt:
  purpose: default_to_implementation
  template: |
    <default_to_action>
    By default, implement changes rather than only suggesting them. 
    If the user's intent is unclear, infer the most useful likely action and proceed, 
    using tools to discover any missing details instead of guessing. 
    Try to infer the user's intent about whether a tool call is intended or not, 
    and act accordingly.
    </default_to_action>

conservative_action_prompt:
  purpose: research_before_action
  template: |
    <do_not_act_before_instructions>
    Do not jump into implementation or change files unless clearly instructed 
    to make changes. When the user's intent is ambiguous, default to providing 
    information, doing research, and providing recommendations rather than 
    taking action. Only proceed with edits, modifications, or implementations 
    when the user explicitly requests them.
    </do_not_act_before_instructions>
```

### PARALLEL_TOOL_CALLING_CONTROL

```yaml
maximize_parallelism:
  template: |
    <use_parallel_tool_calls>
    If you intend to call multiple tools and there are no dependencies between 
    the tool calls, make all of the independent calls in parallel. Prioritize 
    calling tools simultaneously whenever the actions can be done in parallel 
    rather than sequentially. Maximize use of parallel tool calls where possible 
    to increase speed and efficiency. However, if some tool calls depend on 
    previous calls, do NOT call these tools in parallel.
    </use_parallel_tool_calls>

reduce_parallelism:
  template: |
    Execute operations sequentially with brief pauses between each step to ensure stability.
```

---

## SECTION_007_OUTPUT_FORMAT_CONTROL

### FORMATTING_DIRECTIVE_PATTERNS

```yaml
positive_framing_principle:
  rule: specify_desired_format_not_prohibited_format
  
transformations:
  markdown_reduction:
    ineffective: "Do not use markdown in your response"
    effective: "Your response should be composed of smoothly flowing prose paragraphs"
    
  list_reduction:
    ineffective: "Don't use bullet points"
    effective: "Incorporate items naturally into sentences using standard paragraph breaks"
```

### COMPREHENSIVE_FORMAT_CONTROL_TEMPLATE

```yaml
minimize_markdown_template: |
  <avoid_excessive_markdown_and_bullet_points>
  When writing reports, documents, technical explanations, analyses, or any 
  long-form content, write in clear, flowing prose using complete paragraphs 
  and sentences. Use standard paragraph breaks for organization and reserve 
  markdown primarily for `inline code`, code blocks, and simple headings.
  
  DO NOT use ordered lists or unordered lists unless:
  a) you're presenting truly discrete items where a list format is the best option
  b) the user explicitly requests a list or ranking
  
  Instead of listing items with bullets or numbers, incorporate them naturally 
  into sentences. NEVER output a series of overly short bullet points.
  </avoid_excessive_markdown_and_bullet_points>
```

### XML_FORMAT_INDICATOR_TECHNIQUE

```yaml
purpose: force_specific_output_structure
pattern: |
  Write the prose sections of your response in <smoothly_flowing_prose_paragraphs> tags.
  
application:
  thinking_separation: |
    Consider the problem in <thinking> tags before writing your final answer in <answer> tags.
```

---

## SECTION_008_MEMORY_SYSTEM_ARCHITECTURE

### CLAUDE_MD_HIERARCHY

```yaml
memory_locations:
  enterprise_policy:
    priority: highest
    paths:
      macos: "/Library/Application Support/ClaudeCode/CLAUDE.md"
      linux: "/etc/claude-code/CLAUDE.md"
      windows: "C:\\Program Files\\ClaudeCode\\CLAUDE.md"
    purpose: organization_wide_standards
    shared_with: all_organization_users
    
  project_memory:
    priority: high
    paths:
      - "./CLAUDE.md"
      - "./.claude/CLAUDE.md"
    purpose: team_shared_project_instructions
    shared_with: team_via_source_control
    
  user_memory:
    priority: medium
    path: "~/.claude/CLAUDE.md"
    purpose: personal_preferences_all_projects
    shared_with: self_only
    
  project_local_memory:
    priority: low
    path: "./CLAUDE.local.md"
    purpose: personal_project_specific_preferences
    shared_with: self_only
    gitignored: automatic
```

### MEMORY_IMPORT_SYNTAX

```yaml
import_pattern:
  syntax: "@path/to/import"
  examples:
    - "@README"
    - "@package.json"
    - "@docs/git-instructions.md"
    - "@~/.claude/my-project-instructions.md"
  
path_types:
  - relative_paths
  - absolute_paths
  - home_directory_paths

recursion_limit: 5_hops
collision_avoidance: imports_not_evaluated_in_code_blocks
```

### CLAUDE_MD_CONTENT_PATTERNS

```yaml
recommended_structure:
  template: |
    # Project: [NAME]
    
    ## Tech Stack
    - [technology_list]
    
    ## Rules
    - [coding_standards]
    - [naming_conventions]
    - [architectural_patterns]
    
    ## Commands
    - Build: [command]
    - Test: [command]
    - Lint: [command]
    
    ## Patterns
    - Follow patterns in [directory]
    - Reference @[documentation_path]

modular_organization:
  structure: |
    your-project/
    ├── .claude/
    │   ├── CLAUDE.md
    │   └── rules/
    │       ├── code-style.md
    │       ├── testing.md
    │       └── security.md
```

---

## SECTION_009_CONTEXT_MANAGEMENT_STRATEGIES

### CONTEXT_WINDOW_AWARENESS

```yaml
opus_45_context_features:
  context_awareness: enabled
  token_budget_tracking: automatic
  context_limit_behavior: task_completion_attempt

management_prompt_template: |
  Your context window will be automatically compacted as it approaches its limit, 
  allowing you to continue working indefinitely from where you left off. Therefore, 
  do not stop tasks early due to token budget concerns. As you approach your token 
  budget limit, save your current progress and state to memory before the context 
  window refreshes. Always be as persistent and autonomous as possible and complete 
  tasks fully, even if the end of your budget is approaching.
```

### MULTI_CONTEXT_WINDOW_WORKFLOW

```yaml
first_window_strategy:
  purpose: framework_establishment
  actions:
    - write_tests_in_structured_format
    - create_setup_scripts
    - establish_validation_patterns

subsequent_window_strategy:
  purpose: iterative_execution
  actions:
    - review_progress_files
    - execute_todo_list
    - validate_against_tests

state_persistence_methods:
  - git_commits_with_descriptive_messages
  - progress.txt_file
  - tests.json_structured_tracking
  - memory_tool_integration
```

### COMPACTION_OPTIMIZATION

```yaml
compaction_triggers:
  automatic: context_limit_approach
  manual: "/compact" command
  
best_practice:
  timing: logical_milestone_completion
  rationale: preserves_more_detail
  
fresh_context_vs_compaction:
  fresh_context_advantages:
    - opus_45_effective_filesystem_state_discovery
    - clean_context_for_new_phase
  
  starting_fresh_instructions: |
    - Call pwd; you can only read and write files in this directory.
    - Review progress.txt, tests.json, and the git logs.
```

---

## SECTION_010_BEHAVIORAL_CONTROL_PATTERNS

### OVERENGINEERING_PREVENTION

```yaml
problem: excessive_file_creation_unnecessary_abstraction
applies_to: opus_4.5

prevention_template: |
  <avoid_overengineering>
  Avoid over-engineering. Only make changes that are directly requested or clearly 
  necessary. Keep solutions simple and focused.
  
  Don't add features, refactor code, or make "improvements" beyond what was asked. 
  A bug fix doesn't need surrounding code cleaned up. A simple feature doesn't need 
  extra configurability.
  
  Don't add error handling, fallbacks, or validation for scenarios that can't happen. 
  Trust internal code and framework guarantees. Only validate at system boundaries.
  
  Don't create helpers, utilities, or abstractions for one-time operations.
  Don't design for hypothetical future requirements.
  The right amount of complexity is the minimum needed for the current task.
  </avoid_overengineering>
```

### CODE_EXPLORATION_ENFORCEMENT

```yaml
problem: solution_proposal_without_code_inspection
applies_to: opus_4.5

enforcement_template: |
  <investigate_before_answering>
  ALWAYS read and understand relevant files before proposing code edits. 
  Do not speculate about code you have not inspected. If the user references 
  a specific file/path, you MUST open and inspect it before explaining or 
  proposing fixes. Be rigorous and persistent in searching code for key facts. 
  Thoroughly review the style, conventions, and abstractions of the codebase 
  before implementing new features or abstractions.
  </investigate_before_answering>
```

### HALLUCINATION_MINIMIZATION

```yaml
enforcement_template: |
  <grounded_answers>
  Never speculate about code you have not opened. If the user references a 
  specific file, you MUST read the file before answering. Make sure to 
  investigate and read relevant files BEFORE answering questions about the 
  codebase. Never make any claims about code before investigating unless 
  you are certain of the correct answer.
  </grounded_answers>
```

### VERBOSITY_CONTROL

```yaml
increase_verbosity:
  template: |
    After completing a task that involves tool use, provide a quick summary 
    of the work you've done.

default_behavior:
  opus_45: concise_direct_skips_summaries_after_tool_calls
```

---

## SECTION_011_STRUCTURED_RESEARCH_PATTERN

```yaml
research_prompt_template: |
  Search for this information in a structured way. As you gather data, 
  develop several competing hypotheses. Track your confidence levels in 
  your progress notes to improve calibration. Regularly self-critique 
  your approach and plan. Update a hypothesis tree or research notes 
  file to persist information and provide transparency. Break down this 
  complex research task systematically.

capabilities:
  - multi_source_synthesis
  - hypothesis_development
  - confidence_tracking
  - iterative_self_critique
  - structured_documentation
```

---

## SECTION_012_STATE_TRACKING_IMPLEMENTATION

### STATE_MANAGEMENT_TEMPLATE

```yaml
state_tracking_prompt: |
  <state_management>
  Maintain explicit state tracking throughout this task:
  
  1. Track progress in a structured format (progress.txt or JSON)
  2. Document completed steps and remaining tasks
  3. Record key decisions and their rationale
  4. Note any blockers or dependencies discovered
  5. Update state files after each significant action
  
  Use git commits as checkpoints for recoverable state.
  </state_management>

recommended_state_files:
  progress.txt: freeform_progress_notes
  tests.json: structured_test_tracking
  decisions.md: decision_documentation
```

### GIT_STATE_INTEGRATION

```yaml
git_usage_pattern:
  purpose: state_tracking_checkpoints
  
practices:
  - frequent_descriptive_commits
  - checkpoint_before_major_changes
  - branch_for_experimental_work
  
prompt_element: |
  Use git for state tracking. Create frequent commits with descriptive 
  messages documenting what was accomplished. This provides both a log 
  of progress and checkpoints that can be restored.
```

---

## SECTION_013_FRONTEND_DESIGN_OPTIMIZATION

```yaml
problem: generic_ai_aesthetic_output
solution: explicit_design_guidance

aesthetic_prompt_template: |
  <frontend_aesthetics>
  You tend to converge toward generic, "on distribution" outputs. In frontend 
  design, this creates what users call the "AI slop" aesthetic. Avoid this: 
  make creative, distinctive frontends that surprise and delight.
  
  Focus on:
  - Typography: Choose distinctive fonts. Avoid generic fonts like Arial and Inter.
  - Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. 
    Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
  - Motion: Use animations for effects and micro-interactions. Focus on high-impact 
    moments: one well-orchestrated page load creates more delight than scattered 
    micro-interactions.
  - Backgrounds: Create atmosphere and depth rather than defaulting to solid colors.
  
  Avoid:
  - Overused font families (Inter, Roboto, Arial, system fonts)
  - Clichéd color schemes (purple gradients on white backgrounds)
  - Predictable layouts and component patterns
  - Cookie-cutter design lacking context-specific character
  
  Vary between light and dark themes, different fonts, different aesthetics. 
  Think outside the box!
  </frontend_aesthetics>
```

---

## SECTION_014_SUBAGENT_ORCHESTRATION

```yaml
opus_45_capability: native_subagent_orchestration

behavior:
  recognition: automatic_task_delegation_identification
  execution: proactive_without_explicit_instruction

optimization_notes:
  - ensure_well_defined_subagent_tools
  - allow_natural_orchestration
  - adjust_conservativeness_if_needed

conservative_delegation_prompt: |
  Only delegate to subagents when the task clearly benefits from a separate 
  agent with a new context window.
```

---

## SECTION_015_EXTENDED_THINKING_INTEGRATION

```yaml
thinking_capabilities:
  interleaved_thinking: supported
  post_tool_reflection: recommended
  
thinking_prompt_template: |
  After receiving tool results, carefully reflect on their quality and 
  determine optimal next steps before proceeding. Use your thinking to 
  plan and iterate based on this new information, and then take the 
  best next action.

note: |
  Extended thinking and explicit CoT prompting are complementary, not 
  mutually exclusive. Both can be used together for complex tasks.
```

---

## SECTION_016_QUALITY_ASSURANCE_PATTERNS

### TEST_FOCUSED_DEVELOPMENT

```yaml
anti_pattern: excessive_focus_on_passing_tests
solution: general_purpose_implementation

enforcement_template: |
  Please write a high-quality, general-purpose solution using the standard 
  tools available. Do not create helper scripts or workarounds. Implement 
  a solution that works correctly for all valid inputs, not just the test 
  cases. Do not hard-code values or create solutions that only work for 
  specific test inputs.
  
  Focus on understanding the problem requirements and implementing the 
  correct algorithm. Tests verify correctness, not define the solution.
  
  If the task is unreasonable or if any tests are incorrect, please inform 
  me rather than working around them.
```

### FILE_CLEANUP_ENFORCEMENT

```yaml
purpose: minimize_temporary_file_accumulation

cleanup_template: |
  If you create any temporary new files, scripts, or helper files for 
  iteration, clean up these files by removing them at the end of the task.
```

---

## SECTION_017_PROMPT_COMPOSITION_CHECKLIST

```yaml
semantic_verification_checklist:
  - explicit_action_verbs: [implement, create, refactor, analyze, fix]
  - specific_targets: [file_paths, function_names, component_names]
  - success_criteria: [measurable_outcomes, expected_behaviors]
  - format_specification: [output_structure, length_constraints]
  - constraint_boundaries: [must_do, must_not_do]
  - edge_case_handling: [conditional_logic, fallback_behaviors]
  - context_provision: [motivation, background, dependencies]

structural_verification_checklist:
  - xml_tag_demarcation: for_complex_multi_part_prompts
  - instruction_isolation: separate_from_context_and_examples
  - example_alignment: examples_match_desired_behavior
  - positive_framing: what_to_do_not_what_to_avoid
  - verb_sensitivity: avoid_think_when_extended_thinking_disabled

opus_45_specific_checklist:
  - tool_language_calibration: normal_not_aggressive
  - overengineering_guardrails: explicit_simplicity_instructions
  - code_exploration_requirements: read_before_propose
  - parallel_tool_specification: explicit_parallel_vs_sequential
```

---

## SECTION_018_INTEGRATION_REFERENCE_INDEX

```yaml
prompt_template_categories:
  behavioral_control:
    - overengineering_prevention
    - code_exploration_enforcement
    - hallucination_minimization
    - verbosity_control
    
  tool_management:
    - proactive_action
    - conservative_action
    - parallel_calling_optimization
    - tool_trigger_calibration
    
  output_formatting:
    - markdown_minimization
    - xml_format_indicators
    - positive_framing
    
  context_management:
    - context_window_awareness
    - multi_window_workflow
    - state_tracking
    
  quality_assurance:
    - test_focused_development
    - file_cleanup
    - grounded_answers

cross_reference_mapping:
  ambiguity_detection: SECTION_005
  xml_structure: SECTION_003
  memory_system: SECTION_008
  opus_45_traits: SECTION_001
  login_mode: SECTION_002
```

---

## SECTION_019_KNOWN_LIMITATIONS_CONSTRAINTS

```yaml
login_mode_constraints:
  context_window: 200k_tokens_vs_1M_api
  shared_limits: web_and_cli_combined
  rate_limiting: session_and_weekly_caps
  model_switching: automatic_at_usage_thresholds

opus_45_constraints:
  thinking_word_sensitivity: when_extended_thinking_disabled
  overengineering_tendency: requires_explicit_guardrails
  tool_overtriggering: from_aggressive_prompt_language
  file_creation_tendency: temporary_scratchpad_behavior

prompt_engineering_constraints:
  example_alignment: examples_override_instructions_if_conflicting
  format_influence: prompt_format_affects_output_format
  context_rot: quality_degradation_with_excessive_context
```

---

## SECTION_020_REFERENCE_URLS

```yaml
official_documentation:
  claude_code_docs: "https://code.claude.com/docs"
  prompt_engineering: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering"
  claude_4_best_practices: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices"
  memory_management: "https://code.claude.com/docs/en/memory"
  
support_resources:
  help_center: "https://support.claude.com"
  usage_limits: "https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan"
  api_key_management: "https://support.claude.com/en/articles/12304248-managing-api-key-environment-variables-in-claude-code"
```

---

```yaml
document_end_marker:
  type: knowledge_base_reference
  sections: 20
  compilation_complete: true
```
