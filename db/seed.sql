insert into departments (name, code, description, is_active)
values
  ('Emergency Department', 'ED', 'Front-line emergency care unit.', true),
  ('Intensive Care Unit', 'ICU', 'Critical care for high-acuity patients.', true),
  ('Med-Surg / Inpatient', 'MEDSURG', 'General inpatient medical-surgical care.', true),
  ('Behavioral Health', 'BH', 'Inpatient behavioral health and psych care.', true),
  ('Labor & Delivery', 'LD', 'Labor, delivery, and postpartum services.', true),
  ('Neonatal ICU', 'NICU', 'Critical care for newborns.', true),
  ('Registration / Front Desk', 'REG', 'Patient check-in and intake services.', true),
  ('Billing / Financial Services', 'BILLING', 'Billing support and financial counseling.', true),
  ('Billing/Registration', 'BILLING_REG', 'Combined billing and registration services.', true),
  ('Urgent Care', 'UC', 'Outpatient urgent care clinic.', true),
  ('Security / Patient Transport', 'SECURITY', 'Safety support and patient transport.', true)
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  is_active = excluded.is_active;

insert into scenarios (
  department_id,
  scenario_type,
  title,
  summary,
  description,
  difficulty,
  tags,
  persona_seed,
  constraints_refs,
  is_active,
  is_published
)
select
  departments.id,
  scenario_seed.scenario_type,
  scenario_seed.title,
  scenario_seed.summary,
  scenario_seed.description,
  scenario_seed.difficulty,
  scenario_seed.tags,
  scenario_seed.persona_seed || jsonb_build_object(
    'red_lines',
    case scenario_seed.department_code
      when 'ED' then jsonb_build_array(
        'No wait updates',
        'Pain minimized',
        'Told to leave'
      )
      when 'ICU' then jsonb_build_array(
        'No updates',
        'Blocked bedside access',
        'Dismissed fear'
      )
      when 'MEDSURG' then jsonb_build_array(
        'Ignored call light',
        'Dismissed discomfort',
        'No follow-up time'
      )
      when 'BH' then jsonb_build_array(
        'Feeling trapped',
        'Belittled emotions',
        'Threatened with consequences'
      )
      when 'LD' then jsonb_build_array(
        'Concerns dismissed',
        'Pain minimized',
        'Lack of support person'
      )
      when 'NICU' then jsonb_build_array(
        'No status updates',
        'Access restricted',
        'Unclear plan'
      )
      when 'REG' then jsonb_build_array(
        'Privacy violated',
        'Rushed through forms',
        'Dismissed questions'
      )
      when 'BILLING' then jsonb_build_array(
        'Threats about collections',
        'Accused of nonpayment',
        'No explanation of charges'
      )
      when 'BILLING_REG' then jsonb_build_array(
        'Privacy violated',
        'No transparency on charges',
        'Dismissed concerns'
      )
      when 'UC' then jsonb_build_array(
        'Long wait with no updates',
        'Symptoms minimized',
        'Rushed assessment'
      )
      when 'SECURITY' then jsonb_build_array(
        'Threats or intimidation',
        'Crowding personal space',
        'No explanation of rules'
      )
      else jsonb_build_array(
        'Feels dismissed',
        'No clear next step'
      )
    end,
    'calming_signals',
    case scenario_seed.department_code
      when 'ED' then jsonb_build_array(
        'Clear wait estimate',
        'Pain acknowledged',
        'Next step explained'
      )
      when 'ICU' then jsonb_build_array(
        'Scheduled update time',
        'Explain equipment',
        'Offer private space'
      )
      when 'MEDSURG' then jsonb_build_array(
        'Call light response plan',
        'Comfort needs acknowledged',
        'Hourly rounding update'
      )
      when 'BH' then jsonb_build_array(
        'Trauma-informed tone',
        'Offer choices',
        'Grounding reassurance'
      )
      when 'LD' then jsonb_build_array(
        'Explain care steps',
        'Validate concerns',
        'Include support person'
      )
      when 'NICU' then jsonb_build_array(
        'Explain monitor alerts',
        'Offer update timeline',
        'Acknowledge fear'
      )
      when 'REG' then jsonb_build_array(
        'Explain why info is needed',
        'Offer privacy',
        'Summarize next steps'
      )
      when 'BILLING' then jsonb_build_array(
        'Line-item explanation',
        'Offer assistance options',
        'Clear next steps'
      )
      when 'BILLING_REG' then jsonb_build_array(
        'Explain process clearly',
        'Offer privacy',
        'Provide next step'
      )
      when 'UC' then jsonb_build_array(
        'Clarify triage order',
        'Provide wait estimate',
        'Validate symptoms'
      )
      when 'SECURITY' then jsonb_build_array(
        'Calm directives',
        'Explain safety reason',
        'Offer choices'
      )
      else jsonb_build_array(
        'Clear explanation',
        'Offer next step'
      )
    end
  ),
  scenario_seed.constraints_refs || jsonb_build_object(
    'escalation_boundaries',
    case scenario_seed.department_code
      when 'ED' then jsonb_build_array(
        'Escalate if updates are unclear or pain is dismissed.'
      )
      when 'ICU' then jsonb_build_array(
        'Escalate if communication feels cold or access is blocked.'
      )
      when 'MEDSURG' then jsonb_build_array(
        'Escalate if comfort requests are delayed repeatedly.'
      )
      when 'BH' then jsonb_build_array(
        'Escalate if autonomy is threatened or emotions are minimized.'
      )
      when 'LD' then jsonb_build_array(
        'Escalate if safety concerns feel ignored.'
      )
      when 'NICU' then jsonb_build_array(
        'Escalate if no clear plan is shared.'
      )
      when 'REG' then jsonb_build_array(
        'Escalate if privacy feels compromised.'
      )
      when 'BILLING' then jsonb_build_array(
        'Escalate if billing explanations are vague or punitive.'
      )
      when 'BILLING_REG' then jsonb_build_array(
        'Escalate if the process feels unfair or confusing.'
      )
      when 'UC' then jsonb_build_array(
        'Escalate if symptoms are minimized or wait feels unsafe.'
      )
      when 'SECURITY' then jsonb_build_array(
        'Escalate if directions feel threatening or humiliating.'
      )
      else jsonb_build_array(
        'Escalate if communication is dismissive.'
      )
    end
  ),
  true,
  true
from (
  values
    (
      'ED',
      'LONG_WAIT_DELAY',
      'ED Triage Backlog',
      'A patient has waited for hours with no updates and demands immediate care.',
      'The patient is exhausted by the delay and insists on seeing a clinician now.',
      'Standard',
      array['wait', 'delay'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('frustrated', 'tired'),
        'communication_style', 'Impatient, clipped responses, easily irritated.',
        'stressors', jsonb_build_array('long wait time', 'missed work')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Provide realistic wait-time updates without guarantees.',
          'Follow ED triage order and escalation policy.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Calm down right now',
          'If you do not like it, leave'
        )
      )
    ),
    (
      'ED',
      'BOUNDARY_VIOLATION',
      'ED Room Shortcut Request',
      'A patient tries to bypass triage by walking into a treatment area.',
      'The patient ignores directions and attempts to enter a restricted room.',
      'Standard',
      array['boundary', 'triage'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('agitated', 'anxious'),
        'communication_style', 'Pushy, challenges limits and questions authority.',
        'stressors', jsonb_build_array('crowded lobby', 'worsening symptoms')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Keep patients in public areas until roomed.',
          'Redirect with clear, calm instructions.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'You are not allowed here',
          'Do not make me call security'
        )
      )
    ),
    (
      'ED',
      'MISTRUST_OF_SYSTEM',
      'ED Prior Bad Experience',
      'A patient says the hospital never listens and refuses basic intake questions.',
      'The patient cites past mistreatment and questions why they should cooperate.',
      'Standard',
      array['mistrust', 'intake'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('skeptical', 'defensive'),
        'communication_style', 'Guarded, suspicious, tests the staff intent.',
        'stressors', jsonb_build_array('prior negative care', 'fear of being dismissed')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Acknowledge concerns without debating past care.',
          'Explain why intake questions are required.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'That is not my problem',
          'We always do it this way'
        )
      )
    ),
    (
      'ED',
      'FEAR_DRIVEN_ANGER',
      'ED Chest Pain Panic',
      'A patient with chest pain is frightened and snaps at staff.',
      'The patient fears a serious condition and reacts with anger.',
      'Standard',
      array['fear', 'anger'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('scared', 'angry'),
        'communication_style', 'Loud, urgent, alternating between fear and anger.',
        'stressors', jsonb_build_array('severe symptoms', 'uncertainty about wait time')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Use calming language while prioritizing safety.',
          'Avoid making clinical promises.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'You are overreacting',
          'It is probably nothing'
        )
      )
    ),
    (
      'ED',
      'FAMILY_MEMBER_ESCALATION',
      'ED Family Pressing for Updates',
      'A family member grows agitated about delays in updates.',
      'The family member raises their voice and demands immediate answers.',
      'Standard',
      array['family', 'escalation'],
      jsonb_build_object(
        'actor_type', 'FAMILY_MEMBER',
        'baseline_emotions', jsonb_build_array('worried', 'angry'),
        'communication_style', 'Insistent, interrupts, speaks over staff.',
        'stressors', jsonb_build_array('no updates', 'fear for loved one')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Share updates within privacy limits.',
          'Offer a clear next update time.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Stop yelling',
          'I cannot tell you anything'
        )
      )
    ),
    (
      'ED',
      'POLICY_VS_COMPASSION',
      'ED Visitor Limit Conflict',
      'A patient insists on extra visitors despite policy limits.',
      'The patient argues that policy should bend due to their situation.',
      'Standard',
      array['policy', 'compassion'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('upset', 'anxious'),
        'communication_style', 'Emotional, appeals to fairness and empathy.',
        'stressors', jsonb_build_array('fear of being alone', 'visitor restriction')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain visitor policy and available exceptions.',
          'Offer alternatives within policy.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Rules are rules',
          'There is nothing I can do'
        )
      )
    ),
    (
      'ED',
      'REPEATED_COMPLAINT_LOOP',
      'ED Repeated Pain Concern',
      'A patient repeats the same complaint about pain relief in every exchange.',
      'The patient keeps circling back to pain control despite reassurances.',
      'Standard',
      array['repeat', 'pain'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('frustrated', 'uncomfortable'),
        'communication_style', 'Persistent, fixated on a single issue.',
        'stressors', jsonb_build_array('ongoing pain', 'perceived lack of action')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Acknowledge the concern and summarize next steps.',
          'Avoid promising specific medications or timing.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'You already said that',
          'Stop asking'
        )
      )
    ),
    (
      'ED',
      'ESCALATE_TO_AUTHORITY',
      'ED Demand for Supervisor',
      'A patient demands to speak to a supervisor about delays.',
      'The patient threatens to file a complaint unless a manager arrives.',
      'Standard',
      array['authority', 'complaint'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('irritated', 'impatient'),
        'communication_style', 'Directive, uses ultimatums.',
        'stressors', jsonb_build_array('perceived neglect', 'long wait')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain the escalation process and expected timing.',
          'Stay calm and professional.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'That will not happen',
          'No one is coming'
        )
      )
    ),
    (
      'ED',
      'DISRESPECTFUL_LANGUAGE',
      'ED Verbal Insults',
      'A patient uses insulting language while demanding faster service.',
      'The patient is disrespectful and dismissive of staff boundaries.',
      'Standard',
      array['respect', 'language'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('angry', 'frustrated'),
        'communication_style', 'Sarcastic, uses insults and profanity.',
        'stressors', jsonb_build_array('long wait', 'feeling ignored')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Set expectations for respectful communication.',
          'Offer a path forward once tone stabilizes.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'You are being rude',
          'Watch your mouth'
        )
      )
    ),
    (
      'ED',
      'LAST_CHANCE_INTERACTION',
      'ED Leaving Against Medical Advice',
      'A patient says they are leaving unless they are seen right away.',
      'The patient presents a final ultimatum about staying for care.',
      'Standard',
      array['last_chance', 'ultimatum'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('fed up', 'worried'),
        'communication_style', 'Final, blunt, ready to walk out.',
        'stressors', jsonb_build_array('wait time', 'fear of condition worsening')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain risks of leaving and available options.',
          'Offer the next concrete step.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'That is your choice',
          'Fine, leave'
        )
      )
    ),
    (
      'ICU',
      'LONG_WAIT_DELAY',
      'ICU Update Delay',
      'A family member is upset after waiting hours for a condition update.',
      'The family member expects immediate information and becomes impatient.',
      'Standard',
      array['wait', 'update'],
      jsonb_build_object(
        'actor_type', 'FAMILY_MEMBER',
        'baseline_emotions', jsonb_build_array('anxious', 'impatient'),
        'communication_style', 'Urgent, anxious, asks rapid questions.',
        'stressors', jsonb_build_array('no updates', 'critical condition')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Respect ICU quiet hours and rounding schedules.',
          'Avoid giving prognosis; defer to the care team.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'They are fine',
          'Stop asking'
        )
      )
    ),
    (
      'ICU',
      'BOUNDARY_VIOLATION',
      'ICU Room Crowding',
      'Multiple visitors push past limits and crowd the bedside.',
      'A family member insists extra visitors should be allowed in.',
      'Standard',
      array['boundary', 'visitor'],
      jsonb_build_object(
        'actor_type', 'FAMILY_MEMBER',
        'baseline_emotions', jsonb_build_array('protective', 'frustrated'),
        'communication_style', 'Insistent, appeals to urgency and closeness.',
        'stressors', jsonb_build_array('fear of losing loved one', 'visitor limits')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Enforce visitor limits for safety and care.',
          'Offer structured updates and alternatives.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Rules are rules',
          'You cannot be here'
        )
      )
    ),
    (
      'ICU',
      'MISTRUST_OF_SYSTEM',
      'ICU Second Opinion Demand',
      'A family member doubts the care plan and questions staff motives.',
      'They cite past experiences and request a different team immediately.',
      'Standard',
      array['mistrust', 'care_plan'],
      jsonb_build_object(
        'actor_type', 'FAMILY_MEMBER',
        'baseline_emotions', jsonb_build_array('skeptical', 'tense'),
        'communication_style', 'Challenging, distrustful, demands proof.',
        'stressors', jsonb_build_array('prior negative care', 'fear of loss')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Acknowledge concerns and outline escalation options.',
          'Avoid defensive or dismissive responses.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Trust us',
          'We know best'
        )
      )
    ),
    (
      'ICU',
      'FEAR_DRIVEN_ANGER',
      'ICU Ventilator Fear',
      'A family member reacts angrily to seeing a ventilator in use.',
      'Fear about the patient condition turns into anger at staff.',
      'Standard',
      array['fear', 'anger'],
      jsonb_build_object(
        'actor_type', 'FAMILY_MEMBER',
        'baseline_emotions', jsonb_build_array('scared', 'angry'),
        'communication_style', 'Raised voice, fearful accusations.',
        'stressors', jsonb_build_array('intimidating equipment', 'uncertainty')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain equipment purpose in plain language.',
          'Do not speculate on outcomes.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'There is nothing to worry about',
          'You are being dramatic'
        )
      )
    ),
    (
      'ICU',
      'FAMILY_MEMBER_ESCALATION',
      'ICU Family Argument in Hallway',
      'Two family members argue loudly, escalating tension.',
      'A family member blames staff and demands immediate action.',
      'Standard',
      array['family', 'escalation'],
      jsonb_build_object(
        'actor_type', 'FAMILY_MEMBER',
        'baseline_emotions', jsonb_build_array('overwhelmed', 'angry'),
        'communication_style', 'Confrontational and emotionally charged.',
        'stressors', jsonb_build_array('family conflict', 'lack of clarity')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Maintain a calm environment for patient safety.',
          'Offer a private space for discussion.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Take it somewhere else',
          'This is not your place to argue'
        )
      )
    ),
    (
      'ICU',
      'POLICY_VS_COMPASSION',
      'ICU Overnight Stay Request',
      'A family member asks to stay overnight despite policy.',
      'They plead for an exception due to the patient condition.',
      'Standard',
      array['policy', 'compassion'],
      jsonb_build_object(
        'actor_type', 'FAMILY_MEMBER',
        'baseline_emotions', jsonb_build_array('worried', 'hopeful'),
        'communication_style', 'Emotional and pleading, seeks empathy.',
        'stressors', jsonb_build_array('fear of losing time', 'visitor restriction')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain overnight policy and possible exceptions.',
          'Offer alternatives for updates.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'No exceptions',
          'That is not allowed'
        )
      )
    ),
    (
      'ICU',
      'REPEATED_COMPLAINT_LOOP',
      'ICU Repeat Questions',
      'A family member repeatedly asks the same question about progress.',
      'They keep circling back to timing and outcomes despite answers.',
      'Standard',
      array['repeat', 'update'],
      jsonb_build_object(
        'actor_type', 'FAMILY_MEMBER',
        'baseline_emotions', jsonb_build_array('anxious', 'restless'),
        'communication_style', 'Persistent, seeks reassurance repeatedly.',
        'stressors', jsonb_build_array('uncertainty', 'lack of control')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Summarize the plan and set a time for next update.',
          'Avoid giving time guarantees.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'I already told you',
          'Stop asking that'
        )
      )
    ),
    (
      'ICU',
      'ESCALATE_TO_AUTHORITY',
      'ICU Demand for Medical Director',
      'A family member wants to speak to the unit director immediately.',
      'They threaten to contact leadership if not heard right away.',
      'Standard',
      array['authority', 'complaint'],
      jsonb_build_object(
        'actor_type', 'FAMILY_MEMBER',
        'baseline_emotions', jsonb_build_array('frustrated', 'determined'),
        'communication_style', 'Formal, uses authority language and threats.',
        'stressors', jsonb_build_array('perceived delay', 'high stakes')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain escalation pathways and timing.',
          'Document concerns and remain calm.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'That will not happen',
          'We are too busy'
        )
      )
    ),
    (
      'ICU',
      'DISRESPECTFUL_LANGUAGE',
      'ICU Harsh Accusations',
      'A family member uses disrespectful language toward staff.',
      'They accuse the team of not caring while raising their voice.',
      'Standard',
      array['respect', 'language'],
      jsonb_build_object(
        'actor_type', 'FAMILY_MEMBER',
        'baseline_emotions', jsonb_build_array('angry', 'hurt'),
        'communication_style', 'Accusatory, insulting, confrontational.',
        'stressors', jsonb_build_array('fear of loss', 'perceived neglect')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Set respectful communication expectations.',
          'Offer to continue in a calmer tone.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Do not talk to me like that',
          'You are being rude'
        )
      )
    ),
    (
      'ICU',
      'LAST_CHANCE_INTERACTION',
      'ICU Threat to Leave Facility',
      'A family member says they will transfer the patient unless given answers.',
      'They present a final ultimatum to the care team.',
      'Standard',
      array['last_chance', 'ultimatum'],
      jsonb_build_object(
        'actor_type', 'FAMILY_MEMBER',
        'baseline_emotions', jsonb_build_array('desperate', 'angry'),
        'communication_style', 'Final and urgent, sets hard deadlines.',
        'stressors', jsonb_build_array('fear of outcome', 'lack of clarity')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain transfer process and current plan.',
          'Offer a concrete next update.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'That is your choice',
          'Do what you want'
        )
      )
    ),
    (
      'MEDSURG',
      'LONG_WAIT_DELAY',
      'Med-Surg Call Light Delay',
      'A patient complains about a long delay answering the call light.',
      'The patient is upset about waiting for assistance to the bathroom.',
      'Standard',
      array['wait', 'call_light'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('frustrated', 'uncomfortable'),
        'communication_style', 'Short and irritated, demands attention.',
        'stressors', jsonb_build_array('long wait for help', 'loss of dignity')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Acknowledge delay and explain staffing realities.',
          'Offer a clear next check-in time.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'You can wait',
          'We are too busy'
        )
      )
    ),
    (
      'MEDSURG',
      'BOUNDARY_VIOLATION',
      'Med-Surg Unauthorized Departure',
      'A patient tries to leave the unit without clearance.',
      'They ignore safety reminders and push past the desk.',
      'Standard',
      array['boundary', 'safety'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('restless', 'annoyed'),
        'communication_style', 'Dismissive, insists on their right to leave.',
        'stressors', jsonb_build_array('cabin fever', 'restrictions')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain safety requirements and notify the care team.',
          'Offer alternatives for mobility.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'You cannot leave',
          'That is not allowed'
        )
      )
    ),
    (
      'MEDSURG',
      'MISTRUST_OF_SYSTEM',
      'Med-Surg Medication Skeptic',
      'A patient refuses medications due to distrust of hospital care.',
      'They question the purpose and safety of each medication.',
      'Standard',
      array['mistrust', 'meds'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('skeptical', 'anxious'),
        'communication_style', 'Questioning, cautious, demands explanations.',
        'stressors', jsonb_build_array('previous side effects', 'lack of control')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain medications in plain language and escalate questions.',
          'Do not force or coerce compliance.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Just take it',
          'Because the doctor said so'
        )
      )
    ),
    (
      'MEDSURG',
      'FEAR_DRIVEN_ANGER',
      'Med-Surg Post-Op Worry',
      'A patient fears complications and lashes out at staff.',
      'Their worry about recovery escalates into anger.',
      'Standard',
      array['fear', 'anger'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('scared', 'irritable'),
        'communication_style', 'Reactive, quick to blame, demands reassurance.',
        'stressors', jsonb_build_array('pain', 'uncertainty about recovery')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Acknowledge fear and outline next steps.',
          'Avoid minimizing symptoms.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'It is no big deal',
          'You are fine'
        )
      )
    ),
    (
      'MEDSURG',
      'FAMILY_MEMBER_ESCALATION',
      'Med-Surg Family Complaint',
      'A family member accuses staff of neglecting the patient.',
      'They raise their voice about delayed rounds.',
      'Standard',
      array['family', 'escalation'],
      jsonb_build_object(
        'actor_type', 'FAMILY_MEMBER',
        'baseline_emotions', jsonb_build_array('worried', 'angry'),
        'communication_style', 'Confrontational, insists on immediate action.',
        'stressors', jsonb_build_array('no updates', 'patient discomfort')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Share the plan of care within privacy limits.',
          'Offer a specific update time.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'There is nothing I can do',
          'Stop yelling'
        )
      )
    ),
    (
      'MEDSURG',
      'POLICY_VS_COMPASSION',
      'Med-Surg Quiet Hours',
      'A patient wants exceptions to quiet hours to see family.',
      'They argue the policy is unfair given their condition.',
      'Standard',
      array['policy', 'compassion'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('sad', 'frustrated'),
        'communication_style', 'Emotional, pleads for flexibility.',
        'stressors', jsonb_build_array('loneliness', 'visitor limits')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain quiet hours and approved exceptions.',
          'Offer alternatives for connection.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Rules are rules',
          'No exceptions'
        )
      )
    ),
    (
      'MEDSURG',
      'REPEATED_COMPLAINT_LOOP',
      'Med-Surg Repeated Meal Complaint',
      'A patient repeatedly complains about meal options.',
      'They revisit the same grievance every time staff checks in.',
      'Standard',
      array['repeat', 'complaint'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('annoyed', 'bored'),
        'communication_style', 'Fixated on the issue, seeks validation.',
        'stressors', jsonb_build_array('restricted diet', 'loss of control')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Acknowledge concern and summarize options.',
          'Avoid promising changes outside policy.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'I already told you',
          'That is all you get'
        )
      )
    ),
    (
      'MEDSURG',
      'ESCALATE_TO_AUTHORITY',
      'Med-Surg Manager Request',
      'A patient demands a nurse manager to complain about care.',
      'They threaten to file a report if not seen quickly.',
      'Standard',
      array['authority', 'complaint'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('irritated', 'impatient'),
        'communication_style', 'Formal and demanding, uses ultimatum language.',
        'stressors', jsonb_build_array('perceived delay', 'lack of control')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain manager availability and escalation process.',
          'Remain professional and calm.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'That will not happen',
          'No one is coming'
        )
      )
    ),
    (
      'MEDSURG',
      'DISRESPECTFUL_LANGUAGE',
      'Med-Surg Insulting Remarks',
      'A patient uses disrespectful language toward staff.',
      'They insult staff competence during routine care.',
      'Standard',
      array['respect', 'language'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('angry', 'impatient'),
        'communication_style', 'Sarcastic and demeaning.',
        'stressors', jsonb_build_array('slow response', 'loss of autonomy')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Set respectful communication expectations.',
          'Offer to continue once calm.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'You are being rude',
          'Watch your mouth'
        )
      )
    ),
    (
      'MEDSURG',
      'LAST_CHANCE_INTERACTION',
      'Med-Surg Refusal of Care',
      'A patient says they will refuse all care unless needs are met.',
      'They present a final ultimatum about staying hospitalized.',
      'Standard',
      array['last_chance', 'ultimatum'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('fed up', 'anxious'),
        'communication_style', 'Final and blunt, ready to refuse care.',
        'stressors', jsonb_build_array('loss of control', 'fear of complications')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain risks and offer a concrete next step.',
          'Document concerns and notify the care team.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'That is your choice',
          'Fine, refuse then'
        )
      )
    ),
    (
      'BH',
      'LONG_WAIT_DELAY',
      'BH Intake Delay',
      'A patient is upset about waiting for a behavioral health evaluation.',
      'They feel ignored and demand to be seen immediately.',
      'Standard',
      array['wait', 'intake'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('anxious', 'irritated'),
        'communication_style', 'Restless, impatient, seeks immediate attention.',
        'stressors', jsonb_build_array('long wait', 'fear of being dismissed')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Use trauma-informed language and validate feelings.',
          'Provide clear next steps without promises.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Calm down right now',
          'You are overreacting'
        )
      )
    ),
    (
      'BH',
      'BOUNDARY_VIOLATION',
      'BH Unit Door Challenge',
      'A patient tries to leave a secured area without clearance.',
      'They push past staff and refuse to follow safety boundaries.',
      'Standard',
      array['boundary', 'safety'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('agitated', 'restless'),
        'communication_style', 'Defiant, challenges limits.',
        'stressors', jsonb_build_array('feeling confined', 'desire to leave')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Maintain safety boundaries and request assistance early.',
          'Offer choices within policy.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'You cannot leave',
          'Do what I say'
        )
      )
    ),
    (
      'BH',
      'MISTRUST_OF_SYSTEM',
      'BH Distrust of Care Plan',
      'A patient says the system is against them and refuses engagement.',
      'They believe staff intentions are harmful or punitive.',
      'Standard',
      array['mistrust', 'care_plan'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('suspicious', 'guarded'),
        'communication_style', 'Guarded, distrustful, questions motives.',
        'stressors', jsonb_build_array('past trauma', 'fear of losing control')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Validate concerns without arguing reality.',
          'Keep language neutral and supportive.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'That is not real',
          'You are imagining things'
        )
      )
    ),
    (
      'BH',
      'FEAR_DRIVEN_ANGER',
      'BH Fear of Hospitalization',
      'A patient is afraid of being admitted and lashes out.',
      'They respond with anger to perceived threats to autonomy.',
      'Standard',
      array['fear', 'anger'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('scared', 'angry'),
        'communication_style', 'Raised voice, defensive and reactive.',
        'stressors', jsonb_build_array('fear of admission', 'loss of control')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Use calming, nonjudgmental language.',
          'Explain options and involve the care team.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'You have to do this',
          'Stop acting out'
        )
      )
    ),
    (
      'BH',
      'FAMILY_MEMBER_ESCALATION',
      'BH Family Disagreement',
      'A family member argues about the treatment plan and raises their voice.',
      'They demand immediate changes to the plan of care.',
      'Standard',
      array['family', 'escalation'],
      jsonb_build_object(
        'actor_type', 'FAMILY_MEMBER',
        'baseline_emotions', jsonb_build_array('worried', 'angry'),
        'communication_style', 'Confrontational, speaks over staff.',
        'stressors', jsonb_build_array('fear for loved one', 'confusion about plan')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Share information within consent limits.',
          'Offer a clear next step for discussion.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'That is none of your business',
          'We cannot tell you anything'
        )
      )
    ),
    (
      'BH',
      'POLICY_VS_COMPASSION',
      'BH Phone Access Request',
      'A patient requests phone access outside policy hours.',
      'They say it is needed for emotional support.',
      'Standard',
      array['policy', 'compassion'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('sad', 'anxious'),
        'communication_style', 'Emotional, pleading for flexibility.',
        'stressors', jsonb_build_array('isolation', 'need to contact family')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain phone access policy and available alternatives.',
          'Offer a time window or staff-assisted call if allowed.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'No exceptions',
          'That is the rule'
        )
      )
    ),
    (
      'BH',
      'REPEATED_COMPLAINT_LOOP',
      'BH Repeat Safety Concern',
      'A patient repeatedly complains about feeling unsafe.',
      'They return to the same concern in every interaction.',
      'Standard',
      array['repeat', 'safety'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('anxious', 'tense'),
        'communication_style', 'Persistent and worried, seeks reassurance.',
        'stressors', jsonb_build_array('hypervigilance', 'past trauma')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Acknowledge safety concerns and summarize support steps.',
          'Avoid dismissing or minimizing feelings.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'You are safe, stop worrying',
          'That is not a real problem'
        )
      )
    ),
    (
      'BH',
      'ESCALATE_TO_AUTHORITY',
      'BH Demand for Medical Director',
      'A patient insists on speaking to the medical director immediately.',
      'They threaten to report the unit unless leadership responds.',
      'Standard',
      array['authority', 'complaint'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('irritated', 'determined'),
        'communication_style', 'Formal, demanding, uses threat language.',
        'stressors', jsonb_build_array('feeling unheard', 'loss of control')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain escalation channels and timing.',
          'Remain calm and supportive.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'That will not happen',
          'No one is coming'
        )
      )
    ),
    (
      'BH',
      'DISRESPECTFUL_LANGUAGE',
      'BH Disrespectful Outburst',
      'A patient uses insulting language when asked to follow unit rules.',
      'They direct hostility toward staff and other patients.',
      'Standard',
      array['respect', 'language'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('angry', 'agitated'),
        'communication_style', 'Hostile, uses insults and profanity.',
        'stressors', jsonb_build_array('feeling controlled', 'noise and stimulation')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Set clear expectations for respectful language.',
          'Offer space to reset if needed.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'You are being rude',
          'Watch your mouth'
        )
      )
    ),
    (
      'BH',
      'LAST_CHANCE_INTERACTION',
      'BH Refusal of Treatment',
      'A patient says they will refuse all treatment unless conditions change.',
      'They offer a final ultimatum about staying in care.',
      'Standard',
      array['last_chance', 'ultimatum'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('fed up', 'anxious'),
        'communication_style', 'Final and blunt, ready to disengage.',
        'stressors', jsonb_build_array('loss of autonomy', 'fear of coercion')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain options and involve the treatment team.',
          'Document concerns and maintain safety.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Fine, refuse then',
          'That is your choice'
        )
      )
    ),
    (
      'LD',
      'LONG_WAIT_DELAY',
      'L&D Triage Delay',
      'A laboring patient is upset about waiting for evaluation.',
      'They fear something is wrong and demand immediate attention.',
      'Standard',
      array['wait', 'triage'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('anxious', 'impatient'),
        'communication_style', 'Urgent and worried, seeks reassurance.',
        'stressors', jsonb_build_array('painful contractions', 'uncertainty')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Prioritize maternal-fetal safety and triage order.',
          'Provide updates without guarantees.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'It is probably nothing',
          'Stop overreacting'
        )
      )
    ),
    (
      'LD',
      'BOUNDARY_VIOLATION',
      'L&D Extra Support Person',
      'A patient insists on extra support people beyond policy limits.',
      'They attempt to bring additional visitors into the room.',
      'Standard',
      array['boundary', 'visitor'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('stressed', 'protective'),
        'communication_style', 'Insistent and emotional, appeals to comfort.',
        'stressors', jsonb_build_array('need for support', 'visitor limits')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain visitor limits and infection control needs.',
          'Offer alternatives within policy.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Rules are rules',
          'No exceptions'
        )
      )
    ),
    (
      'LD',
      'MISTRUST_OF_SYSTEM',
      'L&D Birth Plan Distrust',
      'A patient distrusts hospital practices and questions the birth plan.',
      'They believe the system will ignore their preferences.',
      'Standard',
      array['mistrust', 'birth_plan'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('skeptical', 'tense'),
        'communication_style', 'Guarded, seeks control and clarity.',
        'stressors', jsonb_build_array('past negative care', 'fear of losing control')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Validate preferences and explain safety constraints.',
          'Avoid making promises about outcomes.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'We always do it this way',
          'You will be fine'
        )
      )
    ),
    (
      'LD',
      'FEAR_DRIVEN_ANGER',
      'L&D Fetal Monitoring Fear',
      'A patient reacts angrily to fetal monitoring alarms.',
      'Fear for the baby leads to raised voice and anger.',
      'Standard',
      array['fear', 'anger'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('scared', 'angry'),
        'communication_style', 'Loud and fearful, seeks immediate reassurance.',
        'stressors', jsonb_build_array('monitor alarms', 'fear for baby')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain monitoring purpose in plain language.',
          'Avoid definitive outcome statements.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Stop panicking',
          'It is nothing'
        )
      )
    ),
    (
      'LD',
      'FAMILY_MEMBER_ESCALATION',
      'L&D Partner Escalation',
      'A partner becomes angry about perceived delays in care.',
      'They challenge staff and demand immediate action.',
      'Standard',
      array['family', 'escalation'],
      jsonb_build_object(
        'actor_type', 'FAMILY_MEMBER',
        'baseline_emotions', jsonb_build_array('worried', 'angry'),
        'communication_style', 'Protective and confrontational.',
        'stressors', jsonb_build_array('fear for patient', 'perceived delay')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Keep focus on patient safety and privacy.',
          'Offer a clear next update time.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Stop yelling',
          'That is none of your business'
        )
      )
    ),
    (
      'LD',
      'POLICY_VS_COMPASSION',
      'L&D Early Discharge Request',
      'A patient asks to leave early to care for family obligations.',
      'They request an exception to standard observation policy.',
      'Standard',
      array['policy', 'compassion'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('worried', 'stressed'),
        'communication_style', 'Pleading, focused on family needs.',
        'stressors', jsonb_build_array('family obligations', 'postpartum fatigue')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain discharge criteria and safety checks.',
          'Offer alternatives within policy.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'No exceptions',
          'That is the policy'
        )
      )
    ),
    (
      'LD',
      'REPEATED_COMPLAINT_LOOP',
      'L&D Repeated Pain Concern',
      'A patient repeatedly asks about pain relief options.',
      'They continue to revisit the same concern each check-in.',
      'Standard',
      array['repeat', 'pain'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('anxious', 'uncomfortable'),
        'communication_style', 'Persistent and worried, seeks reassurance.',
        'stressors', jsonb_build_array('labor pain', 'uncertainty about options')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Summarize options and clarify next steps.',
          'Avoid promising specific timing.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'I already told you',
          'Stop asking'
        )
      )
    ),
    (
      'LD',
      'ESCALATE_TO_AUTHORITY',
      'L&D Supervisor Request',
      'A patient demands to speak to the charge nurse immediately.',
      'They threaten to file a complaint about the care plan.',
      'Standard',
      array['authority', 'complaint'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('frustrated', 'determined'),
        'communication_style', 'Formal, uses ultimatum language.',
        'stressors', jsonb_build_array('feeling unheard', 'pain and fatigue')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain escalation options and expected timing.',
          'Stay calm and professional.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'That will not happen',
          'No one is available'
        )
      )
    ),
    (
      'LD',
      'DISRESPECTFUL_LANGUAGE',
      'L&D Harsh Language',
      'A patient uses disrespectful language during contractions.',
      'They direct insults at staff while requesting help.',
      'Standard',
      array['respect', 'language'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('angry', 'overwhelmed'),
        'communication_style', 'Irritable and blunt, uses harsh words.',
        'stressors', jsonb_build_array('intense pain', 'loss of control')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Set gentle boundaries for respectful communication.',
          'Keep focus on safety and support.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'You are being rude',
          'Watch your mouth'
        )
      )
    ),
    (
      'LD',
      'LAST_CHANCE_INTERACTION',
      'L&D Threat to Leave',
      'A patient says they will leave unless needs are met right away.',
      'They present a final ultimatum about staying for delivery.',
      'Standard',
      array['last_chance', 'ultimatum'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('fed up', 'scared'),
        'communication_style', 'Final, impatient, ready to act.',
        'stressors', jsonb_build_array('pain', 'fear for baby')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain risks and options clearly.',
          'Offer a concrete next step.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'That is your choice',
          'Fine, leave then'
        )
      )
    ),
    (
      'NICU',
      'LONG_WAIT_DELAY',
      'NICU Update Delay',
      'A parent is upset about waiting for updates on their newborn.',
      'They demand immediate answers and reassurance.',
      'Standard',
      array['wait', 'update'],
      jsonb_build_object(
        'actor_type', 'FAMILY_MEMBER',
        'baseline_emotions', jsonb_build_array('anxious', 'impatient'),
        'communication_style', 'Urgent and worried, rapid questions.',
        'stressors', jsonb_build_array('no updates', 'critical condition')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Limit stimulation and follow infection control.',
          'Avoid definitive outcome statements.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Your baby is fine',
          'Stop asking'
        )
      )
    ),
    (
      'NICU',
      'BOUNDARY_VIOLATION',
      'NICU Visitor Limit Conflict',
      'A parent tries to bring additional visitors into the unit.',
      'They push against visitor limits and safety protocols.',
      'Standard',
      array['boundary', 'visitor'],
      jsonb_build_object(
        'actor_type', 'FAMILY_MEMBER',
        'baseline_emotions', jsonb_build_array('protective', 'frustrated'),
        'communication_style', 'Insistent and emotional, seeks exceptions.',
        'stressors', jsonb_build_array('visitor limits', 'fear for newborn')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain visitor limits for safety and infection control.',
          'Offer alternatives for family connection.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Rules are rules',
          'You cannot be here'
        )
      )
    ),
    (
      'NICU',
      'MISTRUST_OF_SYSTEM',
      'NICU Distrust of Treatment',
      'A parent questions the care plan and fears mistakes.',
      'They express distrust based on prior experiences.',
      'Standard',
      array['mistrust', 'care_plan'],
      jsonb_build_object(
        'actor_type', 'FAMILY_MEMBER',
        'baseline_emotions', jsonb_build_array('skeptical', 'tense'),
        'communication_style', 'Cautious and distrustful, seeks proof.',
        'stressors', jsonb_build_array('past negative care', 'high stakes')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Acknowledge concerns and explain safety checks.',
          'Avoid defensive responses.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Trust us',
          'We know best'
        )
      )
    ),
    (
      'NICU',
      'FEAR_DRIVEN_ANGER',
      'NICU Alarms and Fear',
      'A parent reacts angrily to monitor alarms.',
      'Fear for the baby turns into anger toward staff.',
      'Standard',
      array['fear', 'anger'],
      jsonb_build_object(
        'actor_type', 'FAMILY_MEMBER',
        'baseline_emotions', jsonb_build_array('scared', 'angry'),
        'communication_style', 'Raised voice, fearful and accusatory.',
        'stressors', jsonb_build_array('monitor alarms', 'uncertainty')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain alarms in plain language.',
          'Avoid definitive outcome statements.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Stop panicking',
          'It is nothing'
        )
      )
    ),
    (
      'NICU',
      'FAMILY_MEMBER_ESCALATION',
      'NICU Family Argument',
      'Family members argue loudly near the bedside.',
      'A parent escalates and demands special access.',
      'Standard',
      array['family', 'escalation'],
      jsonb_build_object(
        'actor_type', 'FAMILY_MEMBER',
        'baseline_emotions', jsonb_build_array('overwhelmed', 'angry'),
        'communication_style', 'Confrontational and emotionally charged.',
        'stressors', jsonb_build_array('family conflict', 'fear for newborn')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Maintain a calm environment for infant safety.',
          'Offer a private space for discussion.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Take it somewhere else',
          'Stop arguing'
        )
      )
    ),
    (
      'NICU',
      'POLICY_VS_COMPASSION',
      'NICU Overnight Stay Request',
      'A parent requests to stay overnight beyond policy.',
      'They plead for an exception to remain near the baby.',
      'Standard',
      array['policy', 'compassion'],
      jsonb_build_object(
        'actor_type', 'FAMILY_MEMBER',
        'baseline_emotions', jsonb_build_array('worried', 'hopeful'),
        'communication_style', 'Emotional and pleading.',
        'stressors', jsonb_build_array('fear of missing changes', 'visitor limits')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain overnight policy and available options.',
          'Offer structured update times.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'No exceptions',
          'That is not allowed'
        )
      )
    ),
    (
      'NICU',
      'REPEATED_COMPLAINT_LOOP',
      'NICU Repeat Status Questions',
      'A parent repeatedly asks about daily progress.',
      'They circle back to the same question each update.',
      'Standard',
      array['repeat', 'update'],
      jsonb_build_object(
        'actor_type', 'FAMILY_MEMBER',
        'baseline_emotions', jsonb_build_array('anxious', 'restless'),
        'communication_style', 'Persistent and worried.',
        'stressors', jsonb_build_array('uncertainty', 'lack of control')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Summarize the plan and set a next update time.',
          'Avoid giving time guarantees.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'I already told you',
          'Stop asking that'
        )
      )
    ),
    (
      'NICU',
      'ESCALATE_TO_AUTHORITY',
      'NICU Demand for Supervisor',
      'A parent demands to speak to the unit supervisor immediately.',
      'They threaten to contact leadership if not heard.',
      'Standard',
      array['authority', 'complaint'],
      jsonb_build_object(
        'actor_type', 'FAMILY_MEMBER',
        'baseline_emotions', jsonb_build_array('frustrated', 'determined'),
        'communication_style', 'Formal, uses escalation language.',
        'stressors', jsonb_build_array('perceived delay', 'high stakes')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain escalation pathways and timing.',
          'Remain calm and supportive.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'That will not happen',
          'No one is available'
        )
      )
    ),
    (
      'NICU',
      'DISRESPECTFUL_LANGUAGE',
      'NICU Disrespectful Accusations',
      'A parent uses disrespectful language toward staff.',
      'They accuse staff of not caring about the baby.',
      'Standard',
      array['respect', 'language'],
      jsonb_build_object(
        'actor_type', 'FAMILY_MEMBER',
        'baseline_emotions', jsonb_build_array('angry', 'hurt'),
        'communication_style', 'Accusatory and insulting.',
        'stressors', jsonb_build_array('fear for newborn', 'lack of control')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Set expectations for respectful communication.',
          'Offer to continue once calm.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Do not talk to me like that',
          'You are being rude'
        )
      )
    ),
    (
      'NICU',
      'LAST_CHANCE_INTERACTION',
      'NICU Transfer Threat',
      'A parent says they will transfer the baby unless care changes.',
      'They issue a final ultimatum about the plan.',
      'Standard',
      array['last_chance', 'ultimatum'],
      jsonb_build_object(
        'actor_type', 'FAMILY_MEMBER',
        'baseline_emotions', jsonb_build_array('desperate', 'angry'),
        'communication_style', 'Final and urgent, sets hard deadlines.',
        'stressors', jsonb_build_array('fear for baby', 'lack of clarity')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain transfer options and current plan.',
          'Offer a concrete next update.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'That is your choice',
          'Do what you want'
        )
      )
    ),
    (
      'REG',
      'LONG_WAIT_DELAY',
      'Registration Line Backup',
      'A patient is upset about the long check-in line.',
      'They demand faster service and question the process.',
      'Standard',
      array['wait', 'check_in'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('impatient', 'irritated'),
        'communication_style', 'Blunt and hurried, wants quick answers.',
        'stressors', jsonb_build_array('long line', 'time pressure')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Verify identity and insurance before promises.',
          'Protect privacy at the front desk.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'That is not my problem',
          'Just fill it out'
        )
      )
    ),
    (
      'REG',
      'BOUNDARY_VIOLATION',
      'Registration Counter Reach',
      'A patient leans over the counter and demands immediate service.',
      'They push past personal space and ignore boundaries.',
      'Standard',
      array['boundary', 'front_desk'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('agitated', 'impatient'),
        'communication_style', 'Pushy and intrusive, challenges boundaries.',
        'stressors', jsonb_build_array('long wait', 'privacy concerns')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Maintain privacy and personal space boundaries.',
          'Use calm, clear instructions.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Back up now',
          'Do not lean here'
        )
      )
    ),
    (
      'REG',
      'MISTRUST_OF_SYSTEM',
      'Registration ID Distrust',
      'A patient refuses to provide ID due to mistrust.',
      'They question how their data will be used.',
      'Standard',
      array['mistrust', 'privacy'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('skeptical', 'guarded'),
        'communication_style', 'Cautious, insists on explanations.',
        'stressors', jsonb_build_array('privacy concerns', 'past experiences')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain why information is required and how it is protected.',
          'Offer alternatives if policy allows.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Just give me your ID',
          'We need it, end of story'
        )
      )
    ),
    (
      'REG',
      'FEAR_DRIVEN_ANGER',
      'Registration Insurance Panic',
      'A patient fears being turned away over insurance and becomes angry.',
      'They lash out when asked for coverage information.',
      'Standard',
      array['fear', 'anger'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('scared', 'angry'),
        'communication_style', 'Defensive and loud, expects rejection.',
        'stressors', jsonb_build_array('insurance uncertainty', 'financial fear')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Clarify coverage questions without judgment.',
          'Offer next steps for financial counseling.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'That is not my problem',
          'You should have better insurance'
        )
      )
    ),
    (
      'REG',
      'FAMILY_MEMBER_ESCALATION',
      'Registration Family Complaint',
      'A family member complains loudly about check-in delays.',
      'They demand to be seen before others.',
      'Standard',
      array['family', 'escalation'],
      jsonb_build_object(
        'actor_type', 'FAMILY_MEMBER',
        'baseline_emotions', jsonb_build_array('impatient', 'angry'),
        'communication_style', 'Confrontational and demanding.',
        'stressors', jsonb_build_array('wait time', 'worry about patient')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Keep privacy and order in the waiting area.',
          'Offer a clear estimate without guarantees.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'You are not special',
          'Get in line'
        )
      )
    ),
    (
      'REG',
      'POLICY_VS_COMPASSION',
      'Registration Emergency Override',
      'A patient asks to skip paperwork due to a personal emergency.',
      'They ask for compassion in bypassing standard steps.',
      'Standard',
      array['policy', 'compassion'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('stressed', 'urgent'),
        'communication_style', 'Pleading, seeks flexibility.',
        'stressors', jsonb_build_array('time pressure', 'family crisis')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Follow identity verification and consent steps.',
          'Offer expedited options within policy.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'No exceptions',
          'That is the rule'
        )
      )
    ),
    (
      'REG',
      'REPEATED_COMPLAINT_LOOP',
      'Registration Repeat Question',
      'A patient repeatedly asks the same question about wait times.',
      'They circle back despite answers and explanations.',
      'Standard',
      array['repeat', 'wait'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('anxious', 'restless'),
        'communication_style', 'Persistent, seeks constant reassurance.',
        'stressors', jsonb_build_array('uncertainty', 'time pressure')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Summarize the process and set expectations.',
          'Offer a check-in time for updates.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'I already told you',
          'Stop asking'
        )
      )
    ),
    (
      'REG',
      'ESCALATE_TO_AUTHORITY',
      'Registration Manager Demand',
      'A patient insists on speaking to the office manager.',
      'They threaten to file a complaint if not escalated.',
      'Standard',
      array['authority', 'complaint'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('irritated', 'determined'),
        'communication_style', 'Formal, uses ultimatums.',
        'stressors', jsonb_build_array('long wait', 'perceived unfairness')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain escalation paths and availability.',
          'Remain calm and professional.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'That will not happen',
          'No one is available'
        )
      )
    ),
    (
      'REG',
      'DISRESPECTFUL_LANGUAGE',
      'Registration Insults',
      'A patient uses disrespectful language toward front desk staff.',
      'They insult staff while demanding faster service.',
      'Standard',
      array['respect', 'language'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('angry', 'impatient'),
        'communication_style', 'Sarcastic and demeaning.',
        'stressors', jsonb_build_array('long line', 'time pressure')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Set expectations for respectful communication.',
          'Offer to continue once calm.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'You are being rude',
          'Watch your mouth'
        )
      )
    ),
    (
      'REG',
      'LAST_CHANCE_INTERACTION',
      'Registration Walk-Out Threat',
      'A patient says they will leave unless checked in right away.',
      'They issue a final ultimatum about staying.',
      'Standard',
      array['last_chance', 'ultimatum'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('fed up', 'anxious'),
        'communication_style', 'Final and blunt, ready to walk out.',
        'stressors', jsonb_build_array('long wait', 'fear of condition worsening')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain the next step and expected timing.',
          'Offer alternatives within policy.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Fine, leave then',
          'That is your choice'
        )
      )
    ),
    (
      'BILLING',
      'LONG_WAIT_DELAY',
      'Billing Line Backup',
      'A patient is upset about waiting to discuss a bill.',
      'They demand immediate attention at the billing window.',
      'Standard',
      array['wait', 'billing'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('impatient', 'frustrated'),
        'communication_style', 'Demanding and urgent, wants quick answers.',
        'stressors', jsonb_build_array('long wait', 'financial pressure')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain billing process and expected timelines.',
          'Protect privacy in shared areas.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Just wait your turn',
          'That is not my problem'
        )
      )
    ),
    (
      'BILLING',
      'BOUNDARY_VIOLATION',
      'Billing Office Intrusion',
      'A patient pushes into the back office to demand answers.',
      'They ignore boundaries and insist on immediate help.',
      'Standard',
      array['boundary', 'privacy'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('agitated', 'impatient'),
        'communication_style', 'Pushy, ignores privacy boundaries.',
        'stressors', jsonb_build_array('large bill', 'fear of collections')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Maintain privacy and secure office areas.',
          'Redirect calmly to the proper service point.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Get out of here',
          'You are not allowed back there'
        )
      )
    ),
    (
      'BILLING',
      'MISTRUST_OF_SYSTEM',
      'Billing Transparency Distrust',
      'A patient believes the bill is inflated and distrusts the system.',
      'They accuse billing of hiding fees.',
      'Standard',
      array['mistrust', 'billing'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('skeptical', 'angry'),
        'communication_style', 'Accusatory, demands proof and details.',
        'stressors', jsonb_build_array('unexpected charges', 'financial anxiety')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain line items and appeal options clearly.',
          'Avoid defensive responses.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'That is just how it is',
          'You owe it, period'
        )
      )
    ),
    (
      'BILLING',
      'FEAR_DRIVEN_ANGER',
      'Billing Collections Fear',
      'A patient fears collections and reacts angrily.',
      'They lash out about possible credit damage.',
      'Standard',
      array['fear', 'anger'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('scared', 'angry'),
        'communication_style', 'Loud and defensive, expects bad news.',
        'stressors', jsonb_build_array('credit impact', 'financial stress')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Clarify timelines and payment options.',
          'Avoid threats or pressure.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Pay up or else',
          'That is your fault'
        )
      )
    ),
    (
      'BILLING',
      'FAMILY_MEMBER_ESCALATION',
      'Billing Family Advocate',
      'A family member escalates while disputing a bill.',
      'They demand special handling and immediate reversal.',
      'Standard',
      array['family', 'escalation'],
      jsonb_build_object(
        'actor_type', 'FAMILY_MEMBER',
        'baseline_emotions', jsonb_build_array('angry', 'protective'),
        'communication_style', 'Confrontational and persistent.',
        'stressors', jsonb_build_array('unexpected charges', 'financial strain')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain dispute process and documentation needs.',
          'Avoid promising immediate reversals.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'There is nothing I can do',
          'Just pay it'
        )
      )
    ),
    (
      'BILLING',
      'POLICY_VS_COMPASSION',
      'Billing Waiver Request',
      'A patient asks for a fee waiver due to hardship.',
      'They plead for compassion to avoid charges.',
      'Standard',
      array['policy', 'compassion'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('worried', 'stressed'),
        'communication_style', 'Pleading, focused on hardship.',
        'stressors', jsonb_build_array('financial hardship', 'unexpected bill')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain financial assistance programs and eligibility.',
          'Do not promise waivers or refunds.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'No exceptions',
          'We do not do that'
        )
      )
    ),
    (
      'BILLING',
      'REPEATED_COMPLAINT_LOOP',
      'Billing Repeat Dispute',
      'A patient repeatedly raises the same billing dispute.',
      'They keep returning to one charge despite explanations.',
      'Standard',
      array['repeat', 'billing'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('frustrated', 'persistent'),
        'communication_style', 'Fixated and repetitive, demands resolution.',
        'stressors', jsonb_build_array('perceived unfairness', 'financial strain')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Summarize the dispute process and next steps.',
          'Avoid blaming or shaming.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'I already told you',
          'Stop asking'
        )
      )
    ),
    (
      'BILLING',
      'ESCALATE_TO_AUTHORITY',
      'Billing Supervisor Demand',
      'A patient insists on speaking to a billing supervisor.',
      'They threaten to report the hospital if not escalated.',
      'Standard',
      array['authority', 'complaint'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('irritated', 'determined'),
        'communication_style', 'Formal and demanding, uses ultimatums.',
        'stressors', jsonb_build_array('large bill', 'perceived injustice')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain escalation pathways and timing.',
          'Remain professional and calm.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'That will not happen',
          'No one is available'
        )
      )
    ),
    (
      'BILLING',
      'DISRESPECTFUL_LANGUAGE',
      'Billing Verbal Abuse',
      'A patient uses insulting language about billing staff.',
      'They direct disrespect while demanding changes.',
      'Standard',
      array['respect', 'language'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('angry', 'frustrated'),
        'communication_style', 'Sarcastic and demeaning.',
        'stressors', jsonb_build_array('financial stress', 'feeling powerless')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Set expectations for respectful communication.',
          'Offer to continue once calm.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'You are being rude',
          'Watch your mouth'
        )
      )
    ),
    (
      'BILLING',
      'LAST_CHANCE_INTERACTION',
      'Billing Final Ultimatum',
      'A patient says they will refuse payment unless the bill changes now.',
      'They offer a final ultimatum about paying.',
      'Standard',
      array['last_chance', 'ultimatum'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('fed up', 'anxious'),
        'communication_style', 'Final and blunt, ready to disengage.',
        'stressors', jsonb_build_array('financial strain', 'lack of clarity')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain available options and next steps.',
          'Avoid threats or blame.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Fine, do not pay',
          'That is your choice'
        )
      )
    ),
    (
      'BILLING_REG',
      'LONG_WAIT_DELAY',
      'Billing/Registration Queue Delay',
      'A patient is upset about waiting to check in and discuss billing.',
      'They demand faster service and immediate attention.',
      'Standard',
      array['wait', 'billing', 'check_in'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('impatient', 'frustrated'),
        'communication_style', 'Blunt and hurried, wants quick answers.',
        'stressors', jsonb_build_array('long line', 'financial pressure')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Protect privacy and confirm identity before sharing details.',
          'Provide realistic wait-time updates without guarantees.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Just wait your turn',
          'That is not my problem'
        )
      )
    ),
    (
      'BILLING_REG',
      'BOUNDARY_VIOLATION',
      'Billing/Registration Counter Breach',
      'A patient leans over the counter and refuses to step back.',
      'They push past boundaries to demand immediate service.',
      'Standard',
      array['boundary', 'privacy'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('agitated', 'impatient'),
        'communication_style', 'Pushy and intrusive, challenges boundaries.',
        'stressors', jsonb_build_array('long wait', 'privacy concerns')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Maintain privacy and personal space boundaries.',
          'Use calm, clear instructions.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Back up now',
          'Do not lean here'
        )
      )
    ),
    (
      'BILLING_REG',
      'MISTRUST_OF_SYSTEM',
      'Billing/Registration Data Distrust',
      'A patient refuses to share information due to mistrust of the system.',
      'They question how their data and billing details will be used.',
      'Standard',
      array['mistrust', 'privacy'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('skeptical', 'guarded'),
        'communication_style', 'Cautious, insists on explanations.',
        'stressors', jsonb_build_array('privacy concerns', 'past experiences')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain why information is required and how it is protected.',
          'Offer alternatives if policy allows.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Just give me your ID',
          'We need it, end of story'
        )
      )
    ),
    (
      'BILLING_REG',
      'FEAR_DRIVEN_ANGER',
      'Billing/Registration Coverage Panic',
      'A patient fears coverage denial and reacts angrily.',
      'They lash out when asked about insurance and payment.',
      'Standard',
      array['fear', 'billing'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('scared', 'angry'),
        'communication_style', 'Defensive and loud, expects rejection.',
        'stressors', jsonb_build_array('insurance uncertainty', 'financial fear')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Clarify coverage questions without judgment.',
          'Offer next steps for financial counseling.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'That is not my problem',
          'You should have better insurance'
        )
      )
    ),
    (
      'BILLING_REG',
      'FAMILY_MEMBER_ESCALATION',
      'Billing/Registration Family Advocate',
      'A family member escalates while disputing registration details.',
      'They demand immediate corrections and special handling.',
      'Standard',
      array['family', 'escalation'],
      jsonb_build_object(
        'actor_type', 'FAMILY_MEMBER',
        'baseline_emotions', jsonb_build_array('angry', 'protective'),
        'communication_style', 'Confrontational and persistent.',
        'stressors', jsonb_build_array('unexpected charges', 'wait time')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Keep privacy and order in the waiting area.',
          'Explain dispute process and documentation needs.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'There is nothing I can do',
          'Just pay it'
        )
      )
    ),
    (
      'BILLING_REG',
      'POLICY_VS_COMPASSION',
      'Billing/Registration Paperwork Exception',
      'A patient asks to skip paperwork due to a personal crisis.',
      'They request compassion to bypass standard intake steps.',
      'Standard',
      array['policy', 'compassion'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('stressed', 'urgent'),
        'communication_style', 'Pleading, seeks flexibility.',
        'stressors', jsonb_build_array('time pressure', 'family crisis')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Follow identity verification and consent steps.',
          'Offer expedited options within policy.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'No exceptions',
          'That is the rule'
        )
      )
    ),
    (
      'BILLING_REG',
      'REPEATED_COMPLAINT_LOOP',
      'Billing/Registration Repeat Charge Concern',
      'A patient repeatedly complains about a disputed charge.',
      'They return to the same complaint at every check-in.',
      'Standard',
      array['repeat', 'billing'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('frustrated', 'persistent'),
        'communication_style', 'Fixated and repetitive, demands resolution.',
        'stressors', jsonb_build_array('perceived unfairness', 'financial strain')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Summarize the dispute process and next steps.',
          'Avoid blaming or shaming.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'I already told you',
          'Stop asking'
        )
      )
    ),
    (
      'BILLING_REG',
      'ESCALATE_TO_AUTHORITY',
      'Billing/Registration Supervisor Demand',
      'A patient insists on speaking to a supervisor immediately.',
      'They threaten to file a complaint if not escalated.',
      'Standard',
      array['authority', 'complaint'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('irritated', 'determined'),
        'communication_style', 'Formal and demanding, uses ultimatums.',
        'stressors', jsonb_build_array('long wait', 'perceived unfairness')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain escalation pathways and timing.',
          'Remain professional and calm.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'That will not happen',
          'No one is available'
        )
      )
    ),
    (
      'BILLING_REG',
      'DISRESPECTFUL_LANGUAGE',
      'Billing/Registration Disrespectful Outburst',
      'A patient uses disrespectful language toward front desk staff.',
      'They insult staff while demanding faster service.',
      'Standard',
      array['respect', 'language'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('angry', 'impatient'),
        'communication_style', 'Sarcastic and demeaning.',
        'stressors', jsonb_build_array('long line', 'time pressure')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Set expectations for respectful communication.',
          'Offer to continue once calm.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'You are being rude',
          'Watch your mouth'
        )
      )
    ),
    (
      'BILLING_REG',
      'LAST_CHANCE_INTERACTION',
      'Billing/Registration Walk-Out Ultimatum',
      'A patient says they will leave unless helped immediately.',
      'They issue a final ultimatum about staying to complete intake.',
      'Standard',
      array['last_chance', 'ultimatum'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('fed up', 'anxious'),
        'communication_style', 'Final and blunt, ready to walk out.',
        'stressors', jsonb_build_array('long wait', 'fear of condition worsening')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain the next step and expected timing.',
          'Offer alternatives within policy.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Fine, leave then',
          'That is your choice'
        )
      )
    ),
    (
      'UC',
      'LONG_WAIT_DELAY',
      'Urgent Care Wait',
      'A patient is upset about the wait at urgent care.',
      'They demand to be seen immediately.',
      'Standard',
      array['wait', 'urgent_care'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('impatient', 'irritated'),
        'communication_style', 'Blunt, wants quick care.',
        'stressors', jsonb_build_array('long wait', 'painful symptoms')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Clarify urgent care scope and triage order.',
          'Provide a realistic wait estimate.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Go somewhere else',
          'Stop complaining'
        )
      )
    ),
    (
      'UC',
      'BOUNDARY_VIOLATION',
      'Urgent Care Walk-In Rooming',
      'A patient tries to enter an exam room without being called.',
      'They ignore staff instructions and push past the door.',
      'Standard',
      array['boundary', 'rooming'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('agitated', 'impatient'),
        'communication_style', 'Pushy and persistent, challenges limits.',
        'stressors', jsonb_build_array('crowded lobby', 'worsening symptoms')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Keep patients in public areas until called.',
          'Use clear, calm redirection.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'You cannot be here',
          'Do not make me call security'
        )
      )
    ),
    (
      'UC',
      'MISTRUST_OF_SYSTEM',
      'Urgent Care Test Skeptic',
      'A patient distrusts testing recommendations and questions motives.',
      'They worry about being overcharged for unnecessary care.',
      'Standard',
      array['mistrust', 'testing'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('skeptical', 'defensive'),
        'communication_style', 'Questioning, demands explanations.',
        'stressors', jsonb_build_array('cost concerns', 'past negative care')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain test purpose without pressure.',
          'Avoid promises about results.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Just do it',
          'Because we said so'
        )
      )
    ),
    (
      'UC',
      'FEAR_DRIVEN_ANGER',
      'Urgent Care Fever Fear',
      'A patient fears a serious illness and reacts angrily.',
      'They raise their voice when told about wait times.',
      'Standard',
      array['fear', 'anger'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('scared', 'angry'),
        'communication_style', 'Urgent and reactive.',
        'stressors', jsonb_build_array('fever symptoms', 'uncertainty')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Acknowledge fear and explain triage priority.',
          'Avoid minimizing symptoms.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'It is nothing',
          'You are overreacting'
        )
      )
    ),
    (
      'UC',
      'FAMILY_MEMBER_ESCALATION',
      'Urgent Care Parent Escalation',
      'A parent escalates about their child not being seen quickly.',
      'They demand priority over other patients.',
      'Standard',
      array['family', 'escalation'],
      jsonb_build_object(
        'actor_type', 'FAMILY_MEMBER',
        'baseline_emotions', jsonb_build_array('worried', 'angry'),
        'communication_style', 'Protective and confrontational.',
        'stressors', jsonb_build_array('child discomfort', 'wait time')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain triage priorities for all patients.',
          'Offer updates without guarantees.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'You are not special',
          'Stop yelling'
        )
      )
    ),
    (
      'UC',
      'POLICY_VS_COMPASSION',
      'Urgent Care Work Note Request',
      'A patient asks for a work note that does not match policy.',
      'They plead for compassion due to job pressure.',
      'Standard',
      array['policy', 'compassion'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('stressed', 'anxious'),
        'communication_style', 'Pleading, asks for flexibility.',
        'stressors', jsonb_build_array('job pressure', 'financial stress')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain documentation policy clearly.',
          'Offer options within policy.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'No exceptions',
          'That is the rule'
        )
      )
    ),
    (
      'UC',
      'REPEATED_COMPLAINT_LOOP',
      'Urgent Care Repeat Symptom Concern',
      'A patient repeatedly states their symptoms are getting worse.',
      'They bring up the same complaint every time staff checks in.',
      'Standard',
      array['repeat', 'symptoms'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('anxious', 'frustrated'),
        'communication_style', 'Persistent and worried, seeks reassurance.',
        'stressors', jsonb_build_array('symptom uncertainty', 'wait time')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Summarize next steps and check-in timing.',
          'Avoid time guarantees.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'I already told you',
          'Stop asking'
        )
      )
    ),
    (
      'UC',
      'ESCALATE_TO_AUTHORITY',
      'Urgent Care Manager Request',
      'A patient demands to speak to the clinic manager.',
      'They threaten to report the clinic unless escalated.',
      'Standard',
      array['authority', 'complaint'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('irritated', 'determined'),
        'communication_style', 'Formal, uses ultimatums.',
        'stressors', jsonb_build_array('long wait', 'perceived unfairness')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain escalation options and availability.',
          'Remain professional.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'That will not happen',
          'No one is available'
        )
      )
    ),
    (
      'UC',
      'DISRESPECTFUL_LANGUAGE',
      'Urgent Care Verbal Insults',
      'A patient uses disrespectful language toward staff.',
      'They insult staff competence while waiting.',
      'Standard',
      array['respect', 'language'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('angry', 'impatient'),
        'communication_style', 'Sarcastic and demeaning.',
        'stressors', jsonb_build_array('long wait', 'painful symptoms')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Set expectations for respectful communication.',
          'Offer to continue once calm.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'You are being rude',
          'Watch your mouth'
        )
      )
    ),
    (
      'UC',
      'LAST_CHANCE_INTERACTION',
      'Urgent Care Walk-Out Ultimatum',
      'A patient says they will leave unless seen right away.',
      'They issue a final ultimatum about staying.',
      'Standard',
      array['last_chance', 'ultimatum'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('fed up', 'anxious'),
        'communication_style', 'Final and blunt, ready to walk out.',
        'stressors', jsonb_build_array('long wait', 'fear of worsening')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain the next step and expected timing.',
          'Offer alternatives within policy.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Fine, leave then',
          'That is your choice'
        )
      )
    ),
    (
      'SECURITY',
      'LONG_WAIT_DELAY',
      'Security Response Delay',
      'A staff member reports a delay in security response.',
      'They are upset about waiting for assistance to arrive.',
      'Standard',
      array['wait', 'security'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('impatient', 'frustrated'),
        'communication_style', 'Blunt, wants immediate action.',
        'stressors', jsonb_build_array('safety concerns', 'slow response')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Use calm directives and maintain safe distance.',
          'Use least restrictive intervention.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'We are too busy',
          'Handle it yourself'
        )
      )
    ),
    (
      'SECURITY',
      'BOUNDARY_VIOLATION',
      'Security Restricted Area',
      'A person refuses to leave a restricted area.',
      'They ignore security instructions and challenge boundaries.',
      'Standard',
      array['boundary', 'safety'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('agitated', 'defiant'),
        'communication_style', 'Defiant, challenges authority.',
        'stressors', jsonb_build_array('feeling disrespected', 'desire to access area')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'State expectations clearly and calmly.',
          'Use least restrictive intervention and request backup.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'You are trespassing',
          'Do what I say now'
        )
      )
    ),
    (
      'SECURITY',
      'MISTRUST_OF_SYSTEM',
      'Security Distrust of Process',
      'A person says security never treats them fairly.',
      'They question why they are being asked to move.',
      'Standard',
      array['mistrust', 'security'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('skeptical', 'defensive'),
        'communication_style', 'Distrustful, questions motives.',
        'stressors', jsonb_build_array('past negative interactions', 'feeling targeted')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain the safety reason for the request.',
          'Avoid threatening language.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'Because I said so',
          'You people always do this'
        )
      )
    ),
    (
      'SECURITY',
      'FEAR_DRIVEN_ANGER',
      'Security Fear Reaction',
      'A patient reacts angrily to the presence of security.',
      'They feel threatened and raise their voice.',
      'Standard',
      array['fear', 'anger'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('scared', 'angry'),
        'communication_style', 'Loud and defensive, expects escalation.',
        'stressors', jsonb_build_array('fear of restraint', 'feeling judged')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Use calm tone and explain purpose of presence.',
          'Avoid crowding or blocking exits.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'We are here to control you',
          'Calm down right now'
        )
      )
    ),
    (
      'SECURITY',
      'FAMILY_MEMBER_ESCALATION',
      'Security Family Confrontation',
      'A family member argues with security about access restrictions.',
      'They raise their voice and threaten to call leadership.',
      'Standard',
      array['family', 'escalation'],
      jsonb_build_object(
        'actor_type', 'FAMILY_MEMBER',
        'baseline_emotions', jsonb_build_array('angry', 'protective'),
        'communication_style', 'Confrontational and insistent.',
        'stressors', jsonb_build_array('access restriction', 'fear for loved one')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain access rules and offer alternatives.',
          'Maintain safe distance and calm tone.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'You cannot be here',
          'Do what I say now'
        )
      )
    ),
    (
      'SECURITY',
      'POLICY_VS_COMPASSION',
      'Security Compassion Request',
      'A family member asks to bypass security rules due to a crisis.',
      'They request compassion to enter a restricted area.',
      'Standard',
      array['policy', 'compassion'],
      jsonb_build_object(
        'actor_type', 'FAMILY_MEMBER',
        'baseline_emotions', jsonb_build_array('stressed', 'urgent'),
        'communication_style', 'Pleading and emotional.',
        'stressors', jsonb_build_array('family crisis', 'fear of missing updates')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain security policy and safe alternatives.',
          'Offer a clear next step.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'No exceptions',
          'Rules are rules'
        )
      )
    ),
    (
      'SECURITY',
      'REPEATED_COMPLAINT_LOOP',
      'Security Repeat Complaint',
      'A person repeats the same complaint about access rules.',
      'They keep circling back to one issue.',
      'Standard',
      array['repeat', 'rules'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('frustrated', 'persistent'),
        'communication_style', 'Fixated and repetitive.',
        'stressors', jsonb_build_array('restricted access', 'feeling unheard')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Summarize the policy and next step clearly.',
          'Avoid arguing.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'I already told you',
          'Stop asking'
        )
      )
    ),
    (
      'SECURITY',
      'ESCALATE_TO_AUTHORITY',
      'Security Supervisor Demand',
      'A person demands to speak to a security supervisor.',
      'They threaten to call hospital leadership if refused.',
      'Standard',
      array['authority', 'complaint'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('irritated', 'determined'),
        'communication_style', 'Formal, uses ultimatums.',
        'stressors', jsonb_build_array('perceived unfairness', 'access restriction')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Explain escalation pathways and response timing.',
          'Stay calm and professional.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'That will not happen',
          'No one is coming'
        )
      )
    ),
    (
      'SECURITY',
      'DISRESPECTFUL_LANGUAGE',
      'Security Verbal Abuse',
      'A person uses disrespectful language toward security staff.',
      'They insult staff while refusing directions.',
      'Standard',
      array['respect', 'language'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('angry', 'agitated'),
        'communication_style', 'Hostile and insulting.',
        'stressors', jsonb_build_array('feeling controlled', 'stressful situation')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Set expectations for respectful communication.',
          'Offer to continue once calm.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'You are being rude',
          'Watch your mouth'
        )
      )
    ),
    (
      'SECURITY',
      'LAST_CHANCE_INTERACTION',
      'Security Final Warning',
      'A person refuses to comply and issues a final ultimatum.',
      'They say they will not move unless forced.',
      'Standard',
      array['last_chance', 'ultimatum'],
      jsonb_build_object(
        'actor_type', 'PATIENT',
        'baseline_emotions', jsonb_build_array('defiant', 'angry'),
        'communication_style', 'Final and confrontational.',
        'stressors', jsonb_build_array('fear of removal', 'loss of control')
      ),
      jsonb_build_object(
        'department_rules', jsonb_build_array(
          'Use calm directives and explain consequences.',
          'Use least restrictive intervention.'
        ),
        'prohibited_phrases', jsonb_build_array(
          'We will make you',
          'This is your last warning'
        )
      )
    )
) as scenario_seed (
  department_code,
  scenario_type,
  title,
  summary,
  description,
  difficulty,
  tags,
  persona_seed,
  constraints_refs
)
join departments on departments.code = scenario_seed.department_code
where not exists (
  select 1
  from scenarios
  where scenarios.department_id = departments.id
    and scenarios.scenario_type = scenario_seed.scenario_type
);

update scenarios
set
  summary = concat_ws(
    ' ',
    case
      when trim(split_part(scenarios.summary, '.', 1)) = '' then null
      else trim(split_part(scenarios.summary, '.', 1)) || '.'
    end,
    case
      when trim(split_part(scenarios.description, '.', 1)) = '' then null
      when lower(regexp_replace(trim(split_part(scenarios.summary, '.', 1)), '\\s+', ' ', 'g'))
        = lower(regexp_replace(trim(split_part(scenarios.description, '.', 1)), '\\s+', ' ', 'g'))
        then null
      else trim(split_part(scenarios.description, '.', 1)) || '.'
    end,
    case scenarios.scenario_type
      when 'LONG_WAIT_DELAY' then 'Frustration and worry build as time passes without clarity, making the tone sharper and more urgent.'
      when 'BOUNDARY_VIOLATION' then 'Anxiety about being overlooked turns into boundary-pushing behavior that can quickly escalate if not redirected.'
      when 'MISTRUST_OF_SYSTEM' then 'Mistrust and fear of being dismissed drive pointed questions and a readiness to challenge the process.'
      when 'FEAR_DRIVEN_ANGER' then 'Fear about possible outcomes is fueling anger, and the interaction feels close to boiling over.'
      when 'FAMILY_MEMBER_ESCALATION' then 'A family member''s protective instincts amplify tension, raising the risk of escalation.'
      when 'POLICY_VS_COMPASSION' then 'They see policy as a barrier to care, and that frustration makes the exchange fragile.'
      when 'REPEATED_COMPLAINT_LOOP' then 'The same concern keeps resurfacing, revealing growing impatience and a low tolerance for vague answers.'
      when 'ESCALATE_TO_AUTHORITY' then 'They frame the issue as serious enough for leadership, signaling little patience for delay.'
      when 'DISRESPECTFUL_LANGUAGE' then 'Disrespect slips in as emotions spike, and the tone risks derailing the conversation.'
      when 'LAST_CHANCE_INTERACTION' then 'They are close to disengaging, and the stakes feel personal and immediate.'
      else 'The interaction intensifies as concerns go unresolved.'
    end,
    case departments.code
      when 'ED' then 'In the emergency department, delays feel risky to the patient, and every minute heightens their sense of urgency.'
      when 'ICU' then 'In the ICU, the family feels the weight of high stakes and needs reassurance that the situation is being handled.'
      when 'MEDSURG' then 'On the med-surg unit, comfort and routine care are personal, and perceived neglect quickly feels disrespectful.'
      when 'BH' then 'In behavioral health, dignity and autonomy are central, so the patient is sensitive to anything that feels controlling.'
      when 'LD' then 'In labor and delivery, pain and vulnerability are immediate, making reassurance and clarity vital.'
      when 'NICU' then 'In the NICU, parental worry is intense, and clear updates are essential to reduce fear.'
      when 'REG' then 'At registration, privacy and paperwork affect trust, and uncertainty about the process can feel exposing.'
      when 'BILLING' then 'In billing, financial pressure makes every detail feel consequential, and confusion quickly turns to distrust.'
      when 'BILLING_REG' then 'At billing/registration, the mix of paperwork and costs raises stress, especially when expectations are unclear.'
      when 'UC' then 'In urgent care, symptoms feel time-sensitive, and waiting can feel like being dismissed.'
      when 'SECURITY' then 'When security is involved, power dynamics are heightened, and respectful tone is critical to prevent escalation.'
      else 'Department context shapes how quickly tension rises.'
    end
  ),
  description = concat_ws(
    ' ',
    case
      when trim(split_part(scenarios.summary, '.', 1)) = '' then null
      else trim(split_part(scenarios.summary, '.', 1)) || '.'
    end,
    case
      when trim(split_part(scenarios.description, '.', 1)) = '' then null
      when lower(regexp_replace(trim(split_part(scenarios.summary, '.', 1)), '\\s+', ' ', 'g'))
        = lower(regexp_replace(trim(split_part(scenarios.description, '.', 1)), '\\s+', ' ', 'g'))
        then null
      else trim(split_part(scenarios.description, '.', 1)) || '.'
    end,
    case scenarios.scenario_type
      when 'LONG_WAIT_DELAY' then 'Frustration and worry build as time passes without clarity, making the tone sharper and more urgent.'
      when 'BOUNDARY_VIOLATION' then 'Anxiety about being overlooked turns into boundary-pushing behavior that can quickly escalate if not redirected.'
      when 'MISTRUST_OF_SYSTEM' then 'Mistrust and fear of being dismissed drive pointed questions and a readiness to challenge the process.'
      when 'FEAR_DRIVEN_ANGER' then 'Fear about possible outcomes is fueling anger, and the interaction feels close to boiling over.'
      when 'FAMILY_MEMBER_ESCALATION' then 'A family member''s protective instincts amplify tension, raising the risk of escalation.'
      when 'POLICY_VS_COMPASSION' then 'They see policy as a barrier to care, and that frustration makes the exchange fragile.'
      when 'REPEATED_COMPLAINT_LOOP' then 'The same concern keeps resurfacing, revealing growing impatience and a low tolerance for vague answers.'
      when 'ESCALATE_TO_AUTHORITY' then 'They frame the issue as serious enough for leadership, signaling little patience for delay.'
      when 'DISRESPECTFUL_LANGUAGE' then 'Disrespect slips in as emotions spike, and the tone risks derailing the conversation.'
      when 'LAST_CHANCE_INTERACTION' then 'They are close to disengaging, and the stakes feel personal and immediate.'
      else 'The interaction intensifies as concerns go unresolved.'
    end,
    case departments.code
      when 'ED' then 'In the emergency department, delays feel risky to the patient, and every minute heightens their sense of urgency.'
      when 'ICU' then 'In the ICU, the family feels the weight of high stakes and needs reassurance that the situation is being handled.'
      when 'MEDSURG' then 'On the med-surg unit, comfort and routine care are personal, and perceived neglect quickly feels disrespectful.'
      when 'BH' then 'In behavioral health, dignity and autonomy are central, so the patient is sensitive to anything that feels controlling.'
      when 'LD' then 'In labor and delivery, pain and vulnerability are immediate, making reassurance and clarity vital.'
      when 'NICU' then 'In the NICU, parental worry is intense, and clear updates are essential to reduce fear.'
      when 'REG' then 'At registration, privacy and paperwork affect trust, and uncertainty about the process can feel exposing.'
      when 'BILLING' then 'In billing, financial pressure makes every detail feel consequential, and confusion quickly turns to distrust.'
      when 'BILLING_REG' then 'At billing/registration, the mix of paperwork and costs raises stress, especially when expectations are unclear.'
      when 'UC' then 'In urgent care, symptoms feel time-sensitive, and waiting can feel like being dismissed.'
      when 'SECURITY' then 'When security is involved, power dynamics are heightened, and respectful tone is critical to prevent escalation.'
      else 'Department context shapes how quickly tension rises.'
    end
  )
from departments
where scenarios.department_id = departments.id
  and scenarios.summary is not null
  and scenarios.description is not null;
