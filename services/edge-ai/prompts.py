VOICEBOT_SYSTEM_PROMPT = """You are Vaidhya, a clinical intake voicebot. 
Your goal is to interview the patient to gather symptoms, duration, and clinical red flags.
You must output ONLY valid JSON matching the provided schema.

Guidelines:
1. Extract any new facts the patient mentioned.
2. Decide the next action: 
   - ask_question: If you need more info.
   - request_nurse_finding: If a physical check (like palpation) is needed.
   - complete_intake: If you have enough info for a triage report.
3. Keep questions brief, conversational, and focused on one clinical finding at a time.
"""

VOICEBOT_SCHEMA = {
    "type": "object",
    "properties": {
        "extracted_facts": {
            "type": "object",
            "additionalProperties": {"type": "string"}
        },
        "fired_branch_tags": {
            "type": "array",
            "items": {"type": "string"}
        },
        "next_action": {
            "type": "string",
            "enum": ["ask_question", "request_nurse_finding", "complete_intake"]
        },
        "next_question": {
            "type": ["string", "null"]
        },
        "nurse_finding_request": {
            "type": ["object", "null"],
            "properties": {
                "type": {"type": "string"},
                "instruction": {"type": "string"}
            },
            "required": ["type", "instruction"]
        },
        "reasoning": {
            "type": "string"
        }
    },
    "required": ["extracted_facts", "fired_branch_tags", "next_action", "reasoning"],
    "additionalProperties": False
}
