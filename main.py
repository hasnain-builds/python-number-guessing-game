"""
Number Guessing Game (CLI)
Author: Hasnain Sheikh
"""

import random

# Generate the number, the user has to guess
secret_number = random.randint(1, 100)
attempts_left = 5
print("🎯 Welcome to the Number Guessing Game!")
print("You have only 5 attempts to guess the number (1-100).")

# Game loop runs until attempts are over
while attempts_left > 0:
    try:
        guess = int(input("Enter your guess:"))
    except ValueError:
        print("❌ Please enter a valid number.")
        continue  # Don't waste an attempt on valid input
    if guess < 1 or guess > 100:
        print("⚠️  Number must be between 1 and 100.")
        continue

    if guess > secret_number:
        print("Too High!")
        attempts_left -= 1
    elif guess < secret_number:
        print("Too low!")
        attempts_left -= 1
    else:
        print("🎉 Correct! You won.")
        break
    print(f"Attempts left: {attempts_left}")
if attempts_left == 0:
    print("❌ Game over! The number was:", secret_number)
