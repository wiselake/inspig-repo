import React from 'react';
import { TodoData } from '@/types/weekly';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faCircle } from '@fortawesome/free-regular-svg-icons';

interface TodoSectionProps {
    data: TodoData;
}

export const TodoSection: React.FC<TodoSectionProps> = ({ data }) => {
    return (
        <div className="report-card">
            <div className="card-header">
                <h3 className="card-title">중점 관리 사항</h3>
            </div>
            <div className="card-body">
                {data.items.length > 0 ? (
                    <ul className="space-y-2">
                        {data.items.map((item) => (
                            <li key={item.id} className="flex items-start gap-2 text-sm">
                                <FontAwesomeIcon
                                    icon={item.completed ? faCheckCircle : faCircle}
                                    className={`mt-0.5 ${item.completed ? 'text-green-500' : 'text-gray-300'}`}
                                />
                                <span className={item.completed ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'}>
                                    {item.content}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                        등록된 할 일이 없습니다.
                    </div>
                )}
            </div>
        </div>
    );
};
