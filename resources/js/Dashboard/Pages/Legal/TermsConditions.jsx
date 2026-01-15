import React from 'react';

export default function TermsConditions({ content }) {
    return (
        <div className="container pt-4 pb-4">
            <h2 className="">Terms & Conditions</h2>
            <hr />

            {content ? (
                <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            ) : (
                <p>Loading content…</p>
            )}
        </div>
    );
}
