#!/usr/bin/env python3
"""
Database setup script for Daily Practice platform
"""

import mysql.connector
from mysql.connector import Error

def connect_to_database():
    """Connect to MySQL database"""
    try:
        connection = mysql.connector.connect(
            host='8.153.77.15',
            user='connect',
            password='Zhjh0704.',
            database='question',
            port=3306
        )
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def execute_schema(connection):
    """Execute the SQL schema to create tables"""
    try:
        cursor = connection.cursor()
        
        # Read the schema file
        with open('/home/zjh/education-system/backend/database/schema.sql', 'r', encoding='utf-8') as file:
            sql_script = file.read()
        
        # Split the script into individual statements
        statements = sql_script.split(';')
        
        for statement in statements:
            statement = statement.strip()
            if statement:  # Skip empty statements
                print(f"Executing: {statement[:50]}...")
                cursor.execute(statement)
                connection.commit()
        
        print("✓ Schema executed successfully")
        cursor.close()
        return True
        
    except Error as e:
        print(f"Error executing schema: {e}")
        return False

def verify_tables(connection):
    """Verify that all tables were created successfully"""
    try:
        cursor = connection.cursor()
        
        # Get list of tables
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        
        expected_tables = ['users', 'questions', 'practice_records', 'user_answers']
        existing_tables = [table[0] for table in tables]
        
        print("\nTable verification:")
        for table in expected_tables:
            if table in existing_tables:
                print(f"✓ {table} - Created successfully")
            else:
                print(f"✗ {table} - Missing")
        
        cursor.close()
        return expected_tables == sorted(existing_tables)
        
    except Error as e:
        print(f"Error verifying tables: {e}")
        return False

def check_sample_data(connection):
    """Check if sample data was inserted correctly"""
    try:
        cursor = connection.cursor()
        
        # Check users table
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        print(f"✓ Users table: {user_count} sample users inserted")
        
        # Check questions table
        cursor.execute("SELECT COUNT(*) FROM questions")
        question_count = cursor.fetchone()[0]
        print(f"✓ Questions table: {question_count} sample questions inserted")
        
        # Show sample data
        cursor.execute("SELECT username, email FROM users LIMIT 3")
        users = cursor.fetchall()
        print("\nSample users:")
        for user in users:
            print(f"  - {user[0]} ({user[1]})")
        
        cursor.execute("SELECT id, content FROM questions LIMIT 3")
        questions = cursor.fetchall()
        print("\nSample questions:")
        for question in questions:
            print(f"  - ID {question[0]}: {question[1][:50]}...")
        
        cursor.close()
        return True
        
    except Error as e:
        print(f"Error checking sample data: {e}")
        return False

def main():
    """Main function to set up the database"""
    print("Setting up Daily Practice Database...")
    print("=" * 50)
    
    # Connect to database
    connection = connect_to_database()
    if not connection:
        print("Failed to connect to database")
        return
    
    print("✓ Connected to MySQL database successfully")
    
    # Execute schema
    if execute_schema(connection):
        print("✓ Database schema executed successfully")
    else:
        print("✗ Failed to execute schema")
        connection.close()
        return
    
    # Verify tables
    if verify_tables(connection):
        print("✓ All tables created successfully")
    else:
        print("✗ Some tables are missing")
    
    # Check sample data
    if check_sample_data(connection):
        print("✓ Sample data inserted successfully")
    else:
        print("✗ Failed to insert sample data")
    
    # Close connection
    connection.close()
    print("\n" + "=" * 50)
    print("Database setup complete!")

if __name__ == "__main__":
    main()