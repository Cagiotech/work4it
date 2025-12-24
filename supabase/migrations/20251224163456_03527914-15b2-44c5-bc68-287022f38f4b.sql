-- ============================================
-- SHOP/INVENTORY SYSTEM
-- ============================================

-- Product Categories
CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#aeca12',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Products
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  barcode TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  cost_price NUMERIC DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER DEFAULT 5,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inventory Movements (stock in/out)
CREATE TABLE public.inventory_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL, -- 'in', 'out', 'adjustment', 'sale', 'return'
  quantity INTEGER NOT NULL,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  unit_price NUMERIC,
  total_amount NUMERIC,
  reason TEXT,
  reference_id UUID, -- can link to sale, purchase, etc.
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sales
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  sale_number TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  payment_status TEXT DEFAULT 'paid', -- 'paid', 'pending', 'partial'
  notes TEXT,
  sold_by UUID,
  transaction_id UUID REFERENCES public.financial_transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sale Items
CREATE TABLE public.sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  discount_percent NUMERIC DEFAULT 0,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- NOTIFICATION SYSTEM
-- ============================================

CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID, -- target user (null = company-wide)
  user_type TEXT, -- 'company', 'staff', 'student'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'message', 'student', 'financial', 'class', 'equipment', 'shop', 'event', 'system'
  reference_id UUID, -- link to related entity
  reference_type TEXT, -- 'message', 'student', 'transaction', etc.
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- RLS POLICIES FOR SHOP SYSTEM
-- ============================================

-- Product Categories RLS
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all product categories"
ON public.product_categories FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can manage product categories of their company"
ON public.product_categories FOR ALL
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can view product categories of their company"
ON public.product_categories FOR SELECT
USING (company_id IN (SELECT company_id FROM staff WHERE user_id = auth.uid()));

-- Products RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all products"
ON public.products FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can manage products of their company"
ON public.products FOR ALL
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can view products of their company"
ON public.products FOR SELECT
USING (company_id IN (SELECT company_id FROM staff WHERE user_id = auth.uid()));

-- Inventory Movements RLS
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all inventory movements"
ON public.inventory_movements FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can manage inventory of their company"
ON public.inventory_movements FOR ALL
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can view inventory of their company"
ON public.inventory_movements FOR SELECT
USING (company_id IN (SELECT company_id FROM staff WHERE user_id = auth.uid()));

-- Sales RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all sales"
ON public.sales FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can manage sales of their company"
ON public.sales FOR ALL
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can view sales of their company"
ON public.sales FOR SELECT
USING (company_id IN (SELECT company_id FROM staff WHERE user_id = auth.uid()));

-- Sale Items RLS
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all sale items"
ON public.sale_items FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can manage sale items of their company"
ON public.sale_items FOR ALL
USING (sale_id IN (SELECT id FROM sales WHERE company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())))
WITH CHECK (sale_id IN (SELECT id FROM sales WHERE company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())));

CREATE POLICY "Staff can view sale items of their company"
ON public.sale_items FOR SELECT
USING (sale_id IN (SELECT id FROM sales WHERE company_id IN (SELECT company_id FROM staff WHERE user_id = auth.uid())));

-- Notifications RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all notifications"
ON public.notifications FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Company users can manage their notifications"
ON public.notifications FOR ALL
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can view their notifications"
ON public.notifications FOR SELECT
USING (
  (company_id IN (SELECT company_id FROM staff WHERE user_id = auth.uid()) AND user_type = 'staff')
  OR (company_id IN (SELECT company_id FROM staff WHERE user_id = auth.uid()) AND user_id IS NULL)
);

CREATE POLICY "Staff can update their notifications"
ON public.notifications FOR UPDATE
USING (
  company_id IN (SELECT company_id FROM staff WHERE user_id = auth.uid())
  AND (user_type = 'staff' OR user_id IS NULL)
);

CREATE POLICY "Students can view their notifications"
ON public.notifications FOR SELECT
USING (
  (company_id IN (SELECT company_id FROM students WHERE user_id = auth.uid()) AND user_type = 'student')
  OR (company_id IN (SELECT company_id FROM students WHERE user_id = auth.uid()) AND user_id IS NULL AND user_type IS NULL)
);

CREATE POLICY "Students can update their notifications"
ON public.notifications FOR UPDATE
USING (
  company_id IN (SELECT company_id FROM students WHERE user_id = auth.uid())
  AND (user_type = 'student' OR user_id IS NULL)
);

-- ============================================
-- TRIGGERS FOR AUTOMATIC NOTIFICATIONS
-- ============================================

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_company_id UUID,
  p_user_id UUID,
  p_user_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (company_id, user_id, user_type, title, message, type, reference_id, reference_type)
  VALUES (p_company_id, p_user_id, p_user_type, p_title, p_message, p_type, p_reference_id, p_reference_type)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Trigger for new student notification
CREATE OR REPLACE FUNCTION public.notify_new_student()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM create_notification(
    NEW.company_id,
    NULL,
    'company',
    'Novo Aluno Registado',
    'O aluno ' || NEW.full_name || ' foi registado.',
    'student',
    NEW.id,
    'student'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_student
AFTER INSERT ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_student();

-- Trigger for new message notification
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify the receiver
  PERFORM create_notification(
    NEW.company_id,
    NEW.receiver_id,
    NEW.receiver_type,
    'Nova Mensagem',
    'Você recebeu uma nova mensagem.',
    'message',
    NEW.id,
    'message'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_message();

-- Trigger for new financial transaction
CREATE OR REPLACE FUNCTION public.notify_new_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.type = 'income' THEN
    PERFORM create_notification(
      NEW.company_id,
      NULL,
      'company',
      'Nova Receita',
      'Nova receita de €' || NEW.amount || ' - ' || NEW.description,
      'financial',
      NEW.id,
      'transaction'
    );
  ELSIF NEW.type = 'expense' THEN
    PERFORM create_notification(
      NEW.company_id,
      NULL,
      'company',
      'Nova Despesa',
      'Nova despesa de €' || NEW.amount || ' - ' || NEW.description,
      'financial',
      NEW.id,
      'transaction'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_transaction
AFTER INSERT ON public.financial_transactions
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_transaction();

-- Trigger for new sale
CREATE OR REPLACE FUNCTION public.notify_new_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM create_notification(
    NEW.company_id,
    NULL,
    'company',
    'Nova Venda',
    'Nova venda realizada no valor de €' || NEW.total_amount,
    'shop',
    NEW.id,
    'sale'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_sale
AFTER INSERT ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_sale();

-- Trigger for low stock alert
CREATE OR REPLACE FUNCTION public.check_low_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.stock_quantity <= NEW.min_stock_level AND OLD.stock_quantity > OLD.min_stock_level THEN
    PERFORM create_notification(
      NEW.company_id,
      NULL,
      'company',
      'Stock Baixo',
      'O produto "' || NEW.name || '" está com stock baixo (' || NEW.stock_quantity || ' unidades).',
      'shop',
      NEW.id,
      'product'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_low_stock
AFTER UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.check_low_stock();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Add shop module to modules table
INSERT INTO public.modules (key, name, description, icon, sort_order)
VALUES ('shop', 'Loja', 'Gestão de produtos e vendas', 'ShoppingBag', 7)
ON CONFLICT (key) DO NOTHING;

-- Update timestamp trigger for new tables
CREATE TRIGGER update_product_categories_updated_at
BEFORE UPDATE ON public.product_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
BEFORE UPDATE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();