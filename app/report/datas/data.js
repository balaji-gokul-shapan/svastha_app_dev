export const SCREENING_DETAIL_SECTIONS = {
  general: [
    {
      title: "Measurements",
      fields: [
        "height",
        "weight",
        "bmi",
        "pulse",
        "blood_pressure",
        "bp",
        "temperature",
        "spo2",
        "blood_group_name",
      ],
    },

    {
      title: "Systemic Examination",
      fields: [
        "general_appearance",
        "nutritional_status",
        "consciousness",
        "pallor",
        "skin",
        "abdomen",
        "cvs",
        "respiratory_system",
        "rs",
        "neurology",
        "clubbing",
        "posture_spine",
        "skin_assessment",
        "clinical_signs",
      ],
    },

    {
      title: "History & Medication",
      fields: [
        "current_complaints",
        "chronic_disease_name",
        "known_medical_condition",
        "allergy_name",
        "regular_medication",
      ],
    },

    {
      title: "Referral & Follow-up",
      fields: [
        "referral_required",
        "referral_type",
        "referral_type_notes",
        "follow_up_required",
        "follow_up_period",
        "follow_up_notes",
        "remark",
        "remarks",
      ],
    },
  ],

  vision: [
    {
      title: "Vision & Refraction",
      fields: [
        "uses_glasses_or_lens",
        "refractive_error",
        "refractive_error_remarks",
        "lens_type",
        "lens_power",
        "lens_remarks",
      ],
    },

    {
      title: "Right Eye (OD)",
      fields: [
        "od_distance_without",
        "od_distance_with",
        "od_near_without",
        "od_near_with",
        "od_remarks",
      ],
    },

    {
      title: "Left Eye (OS)",
      fields: [
        "os_distance_without",
        "os_distance_with",
        "os_near_without",
        "os_near_with",
        "os_remarks",
      ],
    },

    {
      title: "Both Eyes (OU)",
      fields: [
        "ou_distance_without",
        "ou_distance_with",
        "ou_near_without",
        "ou_near_with",
        "ou_remarks",
      ],
    },

    {
      title: "Color Vision & Muscle Balance",
      fields: [
        "color_vision_status",
        "color_vision_test_type",
        "color_vision_remarks",
        "muscle_balance_remarks",
        "cover_test",
        "strabismus",
      ],
    },

    {
      title: "External Examination",
      fields: [
        "conjunctiva",
        "cornea",
        "pupil",
        "lids",
        "external_other_findings",
      ],
    },

    {
      title: "Referral & Advice",
      fields: [
        "referral_to_specialist",
        "referral_reason",
        "advice_suggestions",
        "follow_up",
        "follow_up_required",
      ],
    },
  ],

  dental: [
    {
      title: "Oral Examination",
      fields: [
        "assessment_date",
        "oral_hygiene",
        "gingival_health",
        "plaque",
        "status",
      ],
    },

    {
      title: "Findings & Risk",
      fields: [
        "caries_count",
        "missing_count",
        "other_count",
        "other_issues_count",
        "risk",
        "risk_score",
        "severity",
      ],
    },

    {
      title: "Referral & Recommendation",
      fields: [
        "referral_action",
        "referral_reason",
        "referral_required",
        "recommendation_type",
        "recommended_to",
        "care_instructions",
      ],
    },

    {
      title: "Notes & Follow-up",
      fields: [
        "remark",
        "remarks",
        "follow_up",
        "follow_up_required",
      ],
    },
  ],

  hearing: [
    {
      title: "Whisper Test",
      fields: [
        "whisper_test_re",
        "whisper_test_le",
        "whisper_test_distance",
        "whisper_test_remarks",
      ],
    },

    {
      title: "Ear Examination",
      fields: ["ear_exam_re", "ear_exam_le"],
    },

    {
      title: "Pure Tone Average",
      fields: [
        "pta_500hz_re",
        "pta_500hz_le",
        "pta_1000hz_re",
        "pta_1000hz_le",
        "pta_2000hz_re",
        "pta_2000hz_le",
        "pta_4000hz_re",
        "pta_4000hz_le",
        "pta_8000hz_re",
        "pta_8000hz_le",
      ],
    },

    {
      title: "Speech & Tympanometry",
      fields: [
        "srt_re",
        "srt_le",
        "speech_recognition_re",
        "speech_recognition_le",
        "tympanometry_re",
        "tympanometry_le",
      ],
    },

    {
      title: "Overall Status & Referral",
      fields: [
        "overall_status_re",
        "overall_status_le",
        "overall_status",
        "referral_grade",
        "referral_priority",
        "referral_reason",
        "referral_required",
        "recommendation_type",
        "recommended_to",
      ],
    },

    {
      title: "Follow-up",
      fields: ["follow_up", "follow_up_period", "follow_up_required"],
    },
  ],

  ent: [
    {
      title: "Ear Examination (Right)",
      fields: [
        "hearing_whisper_re",
        "ear_wax_re",
        "discharge_re",
        "perforation_re",
        "foreign_body_re",
        "infection_re",
        "tympanic_membrane_re",
        "system_examination_re",
      ],
    },

    {
      title: "Ear Examination (Left)",
      fields: [
        "hearing_whisper_le",
        "ear_wax_le",
        "discharge_le",
        "perforation_le",
        "foreign_body_le",
        "infection_le",
        "tympanic_membrane_le",
        "system_examination_le",
      ],
    },

    {
      title: "Ear Findings",
      fields: ["ear_comments"],
    },

    {
      title: "Nose & Sinus",
      fields: [
        "nasal_blockage",
        "nasal_septum",
        "nasal_discharge",
        "nasal_breathing",
        "nose_sinus_comments",
        "sinus_tenderness",
      ],
    },

    {
      title: "Throat & Neck",
      fields: [
        "throat_comments",
        "tonsillar_enlargement",
        "exudates_pus",
        "pharyngeal_wall",
        "redness_congestion",
        "head_neck_lymph_nodes",
        "neck_swelling",
      ],
    },

    {
      title: "Breathing, Speech & Sleep",
      fields: [
        "mouth_breathing",
        "voice_quality",
        "speech_clarity",
        "daytime_sleepiness",
        "sleep_disturbance",
        "respiratory_sleep_comments",
      ],
    },

    {
      title: "History & Risk Factors",
      fields: [
        "allergic_rhinitis",
        "chronic_cough",
        "history_of_nose_bleed",
      ],
    },

    {
      title: "Assessment & Referral",
      fields: [
        "ent_grade",
        "risk_level",
        "recommend_to",
        "referral_required",
        "reason",
        "follow_up_recommended",
        "next_review_date",
        "summary_remarks",
        "any_other_findings",
      ],
    },
  ],
};

export const DETAIL_LABEL_OVERRIDES = {
  bmi: "BMI",
  spo2: "SpO2",
  bp: "Blood Pressure",
  blood_pressure: "Blood Pressure",
  rs: "Respiratory System (RS)",
  cvs: "Cardiovascular System (CVS)",
  srt_re: "Speech Recognition Threshold (Right)",
  srt_le: "Speech Recognition Threshold (Left)",
};

export const SCREENING_DOMAIN_CLASSES = {
  general: {
    solid: "bg-domain-physical",
    soft: "bg-domain-physical-soft/40",
    border: "border-domain-physical-border",
    text: "text-domain-physical-foreground",
    chip: "bg-domain-physical/15 text-domain-physical/60",
  },
  vision: {
    solid: "bg-domain-vision",
    soft: "bg-domain-vision-soft/40",
    border: "border-domain-vision-border",
    text: "text-domain-vision-foreground",
    chip: "bg-domain-vision/15 text-domain-vision/60",
  },
  dental: {
    solid: "bg-domain-oral",
    soft: "bg-domain-oral-soft/40",
    border: "border-domain-oral-border",
    text: "text-domain-oral-foreground",
    chip: "bg-domain-oral/15 text-domain-oral/60",
  },
  hearing: {
    solid: "bg-domain-hearing",
    soft: "bg-domain-hearing-soft/40",
    border: "border-domain-hearing-border",
    text: "text-domain-hearing-foreground",
    chip: "bg-domain-hearing/15 text-domain-hearing/60",
  },
  ent: {
    solid: "bg-domain-hearing",
    soft: "bg-domain-hearing-soft/40",
    border: "border-domain-hearing-border",
    text: "text-domain-hearing-foreground",
    chip: "bg-domain-hearing/15 text-domain-hearing/60",
  },
};