-- ===============================================
-- Create report_issue and report_issue_image tables
-- ===============================================

CREATE TABLE IF NOT EXISTS report_issue (
    report_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    haven_id      UUID NOT NULL,
    issue_type    VARCHAR(100) NOT NULL,
    priority_level VARCHAR(20) NOT NULL DEFAULT 'Medium',
    specific_location TEXT NOT NULL,
    issue_description TEXT NOT NULL,
    status        VARCHAR(30) NOT NULL DEFAULT 'Open',
    user_id       UUID NOT NULL,
    assigned_to   UUID,
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_report_issue_haven
        FOREIGN KEY (haven_id) REFERENCES havens(uuid_id) ON DELETE CASCADE,

    CONSTRAINT fk_report_issue_user
        FOREIGN KEY (user_id) REFERENCES employees(id) ON DELETE CASCADE,

    CONSTRAINT fk_report_issue_assigned
        FOREIGN KEY (assigned_to) REFERENCES employees(id) ON DELETE SET NULL,

    CONSTRAINT check_priority CHECK (priority_level IN ('Low', 'Medium', 'High', 'Urgent')),
    CONSTRAINT check_status   CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed', 'Pending'))
);

CREATE TABLE IF NOT EXISTS report_issue_image (
    id                    SERIAL PRIMARY KEY,
    report_id             UUID NOT NULL,
    image_url             TEXT NOT NULL,
    cloudinary_public_id  VARCHAR(255),
    uploaded_at           TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_report_image_report
        FOREIGN KEY (report_id) REFERENCES report_issue(report_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_report_issue_haven_id   ON report_issue(haven_id);
CREATE INDEX IF NOT EXISTS idx_report_issue_user_id    ON report_issue(user_id);
CREATE INDEX IF NOT EXISTS idx_report_issue_status     ON report_issue(status);
CREATE INDEX IF NOT EXISTS idx_report_image_report_id  ON report_issue_image(report_id);
