import os
from typing import TypedDict, List, Optional
from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field

load_dotenv()

# Define the state of the graph
class AgentState(TypedDict):
    resume_text: str
    job_role: str
    availability: Optional[str]
    screening_result: Optional[dict]
    schedule_proposal: Optional[dict]
    final_evaluation: Optional[dict]
    next_step: str

# Pydantic models for structured output
class ScreeningOutput(BaseModel):
    skills: List[str] = Field(description="List of core skills extracted from the resume")
    experience_years: float = Field(description="Total years of professional experience")
    match_score: int = Field(description="Score from 0-100 indicating how well the candidate matches the job role")
    strengths: List[str] = Field(description="Key strengths of the candidate")

class ScheduleOutput(BaseModel):
    proposed_slots: List[str] = Field(description="List of proposed interview time slots")
    confirmation_text: str = Field(description="A professional message to send to the candidate for confirmation")

class EvaluationOutput(BaseModel):
    recommendation: str = Field(description="Hiring recommendation: 'Strong Hire', 'Hire', 'Hold', or 'Reject'")
    justification: str = Field(description="Detailed reasoning for the recommendation")
    missing_info: List[str] = Field(description="Any information missing that would help make a better decision")

# Initialize LLM
llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.2)

# Node 1: Resume Screening
def screening_agent(state: AgentState):
    print("--- SCREENING CANDIDATE ---")
    prompt = f"""
    You are a Senior Talent Acquisition Specialist.
    Analyze the following resume for the target job role: {state['job_role']}.
    
    Resume Text:
    {state['resume_text']}
    
    Extract the candidate's skills, years of experience, and calculate a match score (0-100).
    Provide a list of strengths.
    """
    
    structured_llm = llm.with_structured_output(ScreeningOutput)
    result = structured_llm.invoke([SystemMessage(content=prompt), HumanMessage(content="Extract resume details.")])
    
    return {
        "screening_result": result.dict(),
        "next_step": "scheduling"
    }

# Node 2: Interview Scheduling
def scheduling_agent(state: AgentState):
    print("--- SCHEDULING INTERVIEW ---")
    availability = state.get('availability') or "General business hours next week"
    
    prompt = f"""
    You are a Recruitment Coordinator.
    Based on the candidate's screening results and their availability, propose 3 interview slots.
    Generate a professional confirmation email text.
    
    Candidate Availability: {availability}
    Role: {state['job_role']}
    """
    
    structured_llm = llm.with_structured_output(ScheduleOutput)
    result = structured_llm.invoke([SystemMessage(content=prompt), HumanMessage(content="Propose interview slots.")])
    
    return {
        "schedule_proposal": result.dict(),
        "next_step": "evaluation"
    }

# Node 3: Candidate Evaluation
def evaluation_agent(state: AgentState):
    print("--- EVALUATING CANDIDATE ---")
    screening = state['screening_result']
    
    prompt = f"""
    You are a Hiring Manager.
    Review the screening results and provide a final hiring recommendation.
    
    Job Role: {state['job_role']}
    Screening Result: {screening}
    
    Provide recommendation (Strong Hire/Hire/Hold/Reject) and justification.
    """
    
    structured_llm = llm.with_structured_output(EvaluationOutput)
    result = structured_llm.invoke([SystemMessage(content=prompt), HumanMessage(content="Provide final evaluation.")])
    
    return {
        "final_evaluation": result.dict(),
        "next_step": "end"
    }

# Build the Graph
workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("screener", screening_agent)
workflow.add_node("scheduler", scheduling_agent)
workflow.add_node("evaluator", evaluation_agent)

# Set Entry Point
workflow.set_entry_point("screener")

# Add Edges
workflow.add_edge("screener", "scheduler")
workflow.add_edge("scheduler", "evaluator")
workflow.add_edge("evaluator", END)

# Compile
app = workflow.compile()
