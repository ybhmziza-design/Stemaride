import database

def seed():
    database.init_db()
    existing = database.get_all_registrations()
    if existing:
        print(f"Database already has {len(existing)} registrations.")
        return
    
    samples = [
        {
            'full_name': 'Brian Kipchumba',
            'phone_number': '0712345678',
            'email': 'brian.kip@example.com',
            'category': 'cycling',
            'category_label': 'Cycling (Individual)',
            'amount_due': 700,
            'needs_hire': False,
            'category_details': {'distance': '30KM Intermediate Route', 'bike_arrangement': 'bringing_own'},
            'is_minor': False,
            'emergency_contact': 'Sarah - 0722111222',
            'mpesa_reference': 'SLK89XY21Q',
            'consent_photography': 1,
            'consent_rules': 1
        },
        {
            'full_name': 'Sharon Achieng',
            'phone_number': '0722998877',
            'email': 'sharon.ach@example.com',
            'category': 'group_of_3',
            'category_label': 'Group of 3 (Cycling/Skating)',
            'amount_due': 1500,
            'needs_hire': False,
            'category_details': {'team_name': 'Nairobi Striders', 'activity_mode': 'Mixed (Cycling, Skating, Walking)'},
            'group_members': [
                {'name': 'Kevin Mwangi', 'phone': '0733445566'},
                {'name': 'Grace Muthoni', 'phone': '0744556677'}
            ],
            'is_minor': False,
            'emergency_contact': 'Peter - 0722334455',
            'mpesa_reference': 'SLM41AB78K',
            'consent_photography': 1,
            'consent_rules': 1
        },
        {
            'full_name': 'Junior Otieno',
            'phone_number': '0799881122',
            'email': 'otieno.family@example.com',
            'category': 'walking',
            'category_label': 'Walking Fun Run',
            'amount_due': 1000,
            'needs_hire': True,
            'hire_details': {'hire_item': 'Roller Skates', 'size': 'EU 38-40 (Medium)', 'safety_kit': 'Helmet + Knee & Elbow Guards'},
            'category_details': {'distance': '5KM Fun Walk', 'pace': 'Relaxed Casual Walk'},
            'is_minor': True,
            'parent_name': 'David Otieno',
            'parent_phone': '0711223344',
            'emergency_contact': 'David Otieno - 0711223344',
            'mpesa_reference': 'SLP92KK55Q',
            'consent_photography': 1,
            'consent_rules': 1
        }
    ]

    for s in samples:
        created = database.create_registration(s)
        print(f"Created sample ticket: {created['ticket_code']} for {created['full_name']}")

if __name__ == '__main__':
    seed()
