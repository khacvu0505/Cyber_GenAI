import os
from pathlib import Path

os.environ.setdefault("CREWAI_STORAGE_DIR", str(Path(__file__).resolve().parents[2] / ".crewai"))
os.environ.setdefault("CREWAI_DISABLE_TELEMETRY", "true")

from crewai import Agent, Crew, Process, Task

from ..schemas import (
    ProposalCreate,
    ProposalGenerationResult,
    RequirementAnalysis,
    RiskReview,
    SolutionPlan,
)
from .llm_service import create_openai_llm


def _shared_context(payload: ProposalCreate) -> str:
    return (
        "Project title: {title}\n"
        "Client: {client_name}\n"
        "Our company: {company_name}\n"
        "Client brief:\n{client_brief}\n\n"
        "Our services and capabilities:\n{service_description}\n\n"
        "Budget: {budget}\nTimeline: {timeline}\n"
        "Constraints:\n{constraints}\nLanguage: {language}"
    ).format(**payload.model_dump())


def build_proposal_crew(payload: ProposalCreate) -> Crew:
    llm = create_openai_llm()
    context = _shared_context(payload)

    analyst = Agent(
        role="Senior Requirements Analyst",
        goal="Transform an ambiguous client brief into a complete, auditable requirement baseline.",
        backstory="You are meticulous, commercially aware, and never invent missing requirements.",
        llm=llm,
        allow_delegation=False,
        memory=False,
        verbose=False,
    )
    architect = Agent(
        role="Solution Architect",
        goal="Design a credible solution that maps directly to the analyzed client requirements.",
        backstory="You balance business value, delivery feasibility, scope, and implementation risk.",
        llm=llm,
        allow_delegation=False,
        memory=False,
        verbose=False,
    )
    reviewer = Agent(
        role="Risk and Compliance Reviewer",
        goal="Challenge the solution, identify gaps, and prevent unsupported commitments.",
        backstory="You are an independent reviewer who values traceability and precise risk mitigation.",
        llm=llm,
        allow_delegation=False,
        memory=False,
        verbose=False,
    )
    writer = Agent(
        role="B2B Proposal Writer",
        goal=f"Write a persuasive, specific, and honest proposal in {payload.language}.",
        backstory="You turn technical plans into executive-ready proposals without fabricating evidence.",
        llm=llm,
        allow_delegation=False,
        memory=False,
        verbose=False,
    )

    requirements_task = Task(
        description=(
            f"Analyze the following opportunity. Separate explicit requirements from assumptions. "
            f"Capture unanswered questions instead of guessing.\n\n{context}"
        ),
        expected_output="A structured requirement analysis with traceable objectives and gaps.",
        output_pydantic=RequirementAnalysis,
        agent=analyst,
    )
    solution_task = Task(
        description=(
            "Create a feasible solution plan from the requirement analysis. Map workstreams and "
            "deliverables to client outcomes. Respect budget, timeline, constraints, and our stated "
            "capabilities. Clearly state assumptions and exclusions."
        ),
        expected_output="A structured solution plan with workstreams, milestones, team roles, and scope boundaries.",
        output_pydantic=SolutionPlan,
        context=[requirements_task],
        agent=architect,
    )
    risk_task = Task(
        description=(
            "Independently review the requirements and solution. Score coverage, list gaps and risks, "
            "and recommend corrections. Reject unsupported promises, invented credentials, and vague deliverables."
        ),
        expected_output="A structured compliance and risk review with actionable mitigations.",
        output_pydantic=RiskReview,
        context=[requirements_task, solution_task],
        agent=reviewer,
    )
    writing_task = Task(
        description=(
            f"Write the final B2B proposal in {payload.language}. Incorporate the review recommendations. "
            "Use Markdown and include: executive summary, client needs, proposed solution, scope and "
            "deliverables, implementation approach, timeline, team model, assumptions and exclusions, "
            "risks and mitigations, commercial note, and next steps. Do not invent prices, certifications, "
            "case studies, or client facts. Mark missing commercial details as To be confirmed."
        ),
        expected_output="An executive-ready Markdown proposal grounded only in the provided brief and reviewed plan.",
        context=[requirements_task, solution_task, risk_task],
        agent=writer,
    )

    return Crew(
        agents=[analyst, architect, reviewer, writer],
        tasks=[requirements_task, solution_task, risk_task, writing_task],
        process=Process.sequential,
        memory=False,
        cache=True,
        verbose=False,
        share_crew=False,
    )


def _structured(task_output, schema):
    value = getattr(task_output, "pydantic", None)
    if isinstance(value, schema):
        return value
    raw = getattr(task_output, "raw", None) or str(task_output)
    return schema.model_validate_json(raw)


def generate_proposal(payload: ProposalCreate) -> ProposalGenerationResult:
    crew = build_proposal_crew(payload)
    output = crew.kickoff()
    task_outputs = getattr(output, "tasks_output", None) or []
    if len(task_outputs) != 4:
        raise RuntimeError("Crew không trả đủ bốn kết quả công việc.")

    requirements = _structured(task_outputs[0], RequirementAnalysis)
    solution = _structured(task_outputs[1], SolutionPlan)
    risks = _structured(task_outputs[2], RiskReview)
    final_markdown = (getattr(task_outputs[3], "raw", None) or str(task_outputs[3])).strip()
    if not final_markdown:
        raise RuntimeError("Crew không tạo được nội dung proposal.")

    return ProposalGenerationResult(
        requirements_analysis=requirements,
        solution_plan=solution,
        risk_review=risks,
        final_markdown=final_markdown,
    )
