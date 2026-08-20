
<RULE[project_scoped]>
Never create or overwrite files (especially configuration files like middleware, next.config, etc.) without first using grep_search or list_dir to check if an equivalent file or convention already exists in the codebase. Always verify the existing architecture first to avoid crashing the application or wiping out progress.
</RULE[project_scoped]>
