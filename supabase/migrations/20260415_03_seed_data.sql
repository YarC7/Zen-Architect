-- Initial Projects and Board Data
DO $$
DECLARE
  user_1_id uuid := '00000000-0000-0000-0000-000000000001';
  user_2_id uuid := '00000000-0000-0000-0000-000000000002';
  user_3_id uuid := '00000000-0000-0000-0000-000000000003';
BEGIN
  -- Projects: Mỗi user có một dự án riêng
  INSERT INTO public.projects (id, title, background_type, background_value, owner_id)
  VALUES 
    ('ba1d0000-1111-2222-3333-444455556666', 'Admin Master Board', 'color', '#f8fafc', user_1_id)
  ON CONFLICT (id) DO NOTHING;

  -- "proj-dev-internal" và "proj-design-system" không phải UUID hợp lệ, 
  -- nên dùng các UUID mẫu khác:
  INSERT INTO public.projects (id, title, background_type, background_value, owner_id)
  VALUES 
    ('00000000-0000-0000-0000-000000000002', 'Development Sprint', 'gradient', 'linear-gradient(to right, #6a11cb 0%, #2575fc 100%)', user_2_id),
    ('00000000-0000-0000-0000-000000000003', 'UI/UX Redesign', 'gradient', 'linear-gradient(to right, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)', user_3_id)
  ON CONFLICT (id) DO NOTHING;

  -- Columns for Admin Project
  INSERT INTO public.columns (id, project_id, title, color, position)
  VALUES 
    ('00000000-0000-0000-0000-000000001001', 'ba1d0000-1111-2222-3333-444455556666', 'To Do', '199 89% 48%', 0),
    ('00000000-0000-0000-0000-000000001002', 'ba1d0000-1111-2222-3333-444455556666', 'In Progress', '25 95% 53%', 1),
    ('00000000-0000-0000-0000-000000001003', 'ba1d0000-1111-2222-3333-444455556666', 'Done', '142 71% 45%', 2)
  ON CONFLICT (id) DO NOTHING;

  -- Cards for Admin Project
  INSERT INTO public.cards (id, column_id, project_id, title, description, start_date, due_date, position, completed)
  VALUES 
    ('00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000001001', 'ba1d0000-1111-2222-3333-444455556666', 'Review Team Performance', 'Họp đánh giá hiệu quả tháng 3', '2026-04-12', '2026-04-15', 0, false),
    ('00000000-0000-0000-0000-000000002002', '00000000-0000-0000-0000-000000001002', 'ba1d0000-1111-2222-3333-444455556666', 'Update Roadmaps 2026', 'Cập nhật lộ trình phát triển sản phẩm', '2026-04-16', '2026-04-20', 0, false)
  ON CONFLICT (id) DO NOTHING;

  -- Assignees (Thêm John Dev và Sarah Design vào card của Admin)
  INSERT INTO public.card_assignees (card_id, profile_id)
  VALUES 
    ('00000000-0000-0000-0000-000000002001', user_2_id),
    ('00000000-0000-0000-0000-000000002001', user_3_id)
  ON CONFLICT DO NOTHING;

END $$;
