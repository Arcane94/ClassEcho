// Session access helpers that decide what a user can view, edit, export, or delete.
const SessionAccess = require('../models/SessionAccessModel');

const ROLE_LABELS = {
  creator: 'Creator',
  viewer: 'View only',
  viz_editor: 'Visualization editor',
  full_editor: 'Full editor',
};

function normalizeUserId(rawValue) {
  const numericValue = Number(rawValue);
  return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : null;
}

function buildPermissions(role, isCreator) {
  if (isCreator || role === 'creator') {
    return {
      can_view_session: true,
      can_export_csv: true,
      can_edit_visualization: true,
      can_edit_session: true,
      can_delete_session: true,
      can_manage_access: true,
    };
  }

  if (role === 'full_editor') {
    return {
      can_view_session: true,
      can_export_csv: true,
      can_edit_visualization: true,
      can_edit_session: true,
      can_delete_session: false,
      can_manage_access: false,
    };
  }

  if (role === 'viz_editor') {
    return {
      can_view_session: true,
      can_export_csv: true,
      can_edit_visualization: true,
      can_edit_session: false,
      can_delete_session: false,
      can_manage_access: false,
    };
  }

  if (role === 'viewer') {
    return {
      can_view_session: true,
      can_export_csv: true,
      can_edit_visualization: false,
      can_edit_session: false,
      can_delete_session: false,
      can_manage_access: false,
    };
  }

  return {
    can_view_session: false,
    can_export_csv: false,
    can_edit_visualization: false,
    can_edit_session: false,
    can_delete_session: false,
    can_manage_access: false,
  };
}

exports.normalizeUserId = normalizeUserId;
exports.ROLE_LABELS = ROLE_LABELS;

exports.describeSessionAccess = async function describeSessionAccess(session, rawUserId) {
  const userId = normalizeUserId(rawUserId);
  const creatorId = normalizeUserId(session?.creator);
  const isCreator = userId !== null && creatorId !== null && creatorId === userId;

  let accessRow = null;
  if (!isCreator && userId !== null && session?.session_id != null) {
    accessRow = await SessionAccess.getBySessionIdAndUserId(session.session_id, userId);
  }

  const accessRole = isCreator ? 'creator' : accessRow?.role ?? null;

  return {
    user_id: userId,
    is_creator: isCreator,
    access_role: accessRole,
    access_role_label: accessRole ? ROLE_LABELS[accessRole] ?? accessRole : null,
    permissions: buildPermissions(accessRole, isCreator),
    access_row: accessRow,
  };
};

exports.serializeSessionForUser = function serializeSessionForUser(session, accessDescriptor) {
  return {
    ...session,
    lesson_name: session.session_name,
    access_role: accessDescriptor.access_role,
    access_role_label: accessDescriptor.access_role_label,
    is_creator: accessDescriptor.is_creator,
    permissions: accessDescriptor.permissions,
  };
};
