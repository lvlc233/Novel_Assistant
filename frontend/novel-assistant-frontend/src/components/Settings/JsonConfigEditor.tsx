import React, { useState, useEffect } from 'react';
import { Code, AlertCircle } from 'lucide-react';

interface JsonConfigEditorProps {
    config: any;
    onChange: (newConfig: any) => void;
}

const JsonConfigEditor: React.FC<JsonConfigEditorProps> = ({ config, onChange }) => {
    const [jsonStr, setJsonStr] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            setJsonStr(JSON.stringify(config, null, 4));
            setError(null);
        } catch (e) {
            setJsonStr('Error stringifying JSON');
        }
    }, [config]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setJsonStr(val);
        try {
            const parsed = JSON.parse(val);
            setError(null);
            onChange(parsed);
        } catch (e) {
            setError('Invalid JSON format');
        }
    };

    return (
        <div className="space-y-2 h-full flex flex-col">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span className="flex items-center gap-1 font-bold">
                    <Code size={12} />
                    Advanced JSON Config
                </span>
                {error && (
                    <span className="flex items-center gap-1 text-red-500 font-bold">
                        <AlertCircle size={12} />
                        {error}
                    </span>
                )}
            </div>
            <textarea
                className={`w-full flex-1 bg-gray-50 border rounded-lg p-4 font-mono text-xs outline-none resize-none transition-colors ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-black'}`}
                value={jsonStr}
                onChange={handleChange}
                spellCheck={false}
            />
        </div>
    );
};

export default JsonConfigEditor;
