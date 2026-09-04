import { transcribeAudio, evaluateAnswer, generateQuestions } from './services/aiService.js';
import fs from 'fs';
import path from 'path';

async function testGenerateQuestions() {
    console.log('\n=== Testing generateQuestions ===');
    try {
        const questions = await generateQuestions('MERN Stack Developer', 'Junior', 3, 'coding-mix');
        console.log('✅ Questions generated:', questions.length);
        questions.forEach((q, i) => console.log(`  ${i + 1}. ${q}`));
        return questions;
    } catch (error) {
        console.error('❌ generateQuestions failed:', error.message);
        throw error;
    }
}

async function testEvaluateAnswer() {
    console.log('\n=== Testing evaluateAnswer (oral) ===');
    try {
        const result = await evaluateAnswer(
            'Explain the difference between useState and useReducer in React.',
            'oral',
            'MERN Stack Developer',
            'Junior',
            'useState is for simple state logic while useReducer is for complex state logic with multiple sub-values.',
            ''
        );
        console.log('✅ Evaluation result:', JSON.stringify(result, null, 2));
        return result;
    } catch (error) {
        console.error('❌ evaluateAnswer (oral) failed:', error.message);
        throw error;
    }
}

async function testEvaluateAnswerWithCode() {
    console.log('\n=== Testing evaluateAnswer (coding) ===');
    try {
        const result = await evaluateAnswer(
            'Write a function to reverse a string in JavaScript.',
            'coding',
            'MERN Stack Developer',
            'Junior',
            '',
            'function reverseString(str) { return str.split("").reverse().join(""); }'
        );
        console.log('✅ Evaluation result:', JSON.stringify(result, null, 2));
        return result;
    } catch (error) {
        console.error('❌ evaluateAnswer (coding) failed:', error.message);
        throw error;
    }
}

async function testTranscribeAudio() {
    console.log('\n=== Testing transcribeAudio ===');
    console.log('Note: This test requires an actual audio file.');
    console.log('Skipping transcription test - no audio file available.');
    return null;
}

async function runAllTests() {
    console.log('🧪 Starting AI Service Tests...\n');

    try {
        await testGenerateQuestions();
        await testEvaluateAnswer();
        await testEvaluateAnswerWithCode();
        await testTranscribeAudio();

        console.log('\n✅ All tests passed!');
    } catch (error) {
        console.error('\n❌ Some tests failed:', error.message);
        process.exit(1);
    }
}

runAllTests();